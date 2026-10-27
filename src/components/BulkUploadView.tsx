import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderUp,
  FileArchive,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import { CatalogueItem, BatchUploadProgress } from '../types';

interface BulkUploadViewProps {
  onBatchItemComplete: (item: CatalogueItem) => void;
  onNavigateToNeedsReview: () => void;
  onNavigateToCatalogue: () => void;
}

interface QueuedFile {
  id: string;
  file: File | Blob;
  name: string;
  size: number;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'needs_review' | 'error';
  errorMessage?: string;
  resultItem?: CatalogueItem;
}

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  onBatchItemComplete,
  onNavigateToNeedsReview,
  onNavigateToCatalogue,
}) => {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Counts
  const totalCount = queue.length;
  const uploadedCount = queue.filter((f) => f.status !== 'pending').length;
  const processingCount = queue.filter((f) => f.status === 'processing' || f.status === 'uploading').length;
  const doneCount = queue.filter((f) => f.status === 'done' || f.status === 'needs_review').length;
  const autoPublishedCount = queue.filter((f) => f.status === 'done').length;
  const needsReviewCount = queue.filter((f) => f.status === 'needs_review').length;

  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: QueuedFile[] = [];

    Array.from(files).forEach((file) => {
      // Check if it's a zip file
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        handleZipFile(file);
        return;
      }

      // Filter for image types
      if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name)) {
        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id: 'q_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          file,
          name: file.name,
          size: file.size,
          previewUrl,
          status: 'pending',
        });
      }
    });

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleZipFile = async (zipFile: File) => {
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(zipFile);
      const extractedFiles: QueuedFile[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zipContents.files)) {
        if (!zipEntry.dir && /\.(jpg|jpeg|png|webp|heic)$/i.test(zipEntry.name)) {
          const blob = await zipEntry.async('blob');
          const previewUrl = URL.createObjectURL(blob);
          extractedFiles.push({
            id: 'q_zip_' + Math.random().toString(36).substring(2, 9),
            file: blob,
            name: pathBasename(relativePath),
            size: blob.size,
            previewUrl,
            status: 'pending',
          });
        }
      }

      if (extractedFiles.length > 0) {
        setQueue((prev) => [...prev, ...extractedFiles]);
      }
    } catch (err) {
      console.error('Error unpacking zip file:', err);
    }
  };

  const pathBasename = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  const fileToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Process batch of items with concurrency of 2
  const startBatchProcessing = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pendingQueue = queue.filter((item) => item.status === 'pending');
    if (pendingQueue.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Process one by one or in small batches of 2
    for (const item of pendingQueue) {
      // Set to uploading/processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
      );

      try {
        const base64Data = await fileToBase64(item.file);

        const response = await fetch('/api/catalogue/analyze-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            fileName: item.name,
            mimeType: item.file.type || 'image/jpeg',
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'AI analysis failed');
        }

        const analyzedItem: CatalogueItem = data.item;
        const finalStatus = analyzedItem.status === 'needs_review' ? 'needs_review' : 'done';

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: finalStatus,
                  resultItem: analyzedItem,
                }
              : q
          )
        );

        onBatchItemComplete(analyzedItem);
      } catch (err: any) {
        console.error('Failed to process item:', item.name, err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: err.message || 'Analysis failed',
                }
              : q
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status === 'pending' || item.status === 'processing'));
  };

  // Optional sample loader for quick test
  const loadReferenceTestPhotos = async () => {
    // Elegant high quality jewelry photography samples for demonstration if user wants to test
    const samples = [
      {
        name: 'emerald_cut_ring_worn.jpg',
        url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'sapphire_drop_earrings_ear.jpg',
        url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'diamond_tennis_bracelet_wrist.jpg',
        url: 'https://images.unsplash.com/photo-1611591475819-798839958372?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'ruby_pendant_necklace_neck.jpg',
        url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      },
    ];

    for (const sample of samples) {
      try {
        const res = await fetch(sample.url);
        const blob = await res.blob();
        const previewUrl = URL.createObjectURL(blob);
        setQueue((prev) => [
          ...prev,
          {
            id: 'sample_' + Math.random().toString(36).substring(2, 8),
            file: blob,
            name: sample.name,
            size: blob.size,
            previewUrl,
            status: 'pending',
          },
        ]);
      } catch (e) {
        console.error('Failed to load sample image', e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-white rounded-2xl border border-[#E8DFD0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#996515] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              Automated AI Vision Categorization
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900">
              Bulk Photo Ingestion
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Drop multiple jewelry photos, folders, or ZIP archives at once. The AI inspects each piece, identifies 
              the jewelry type, gemstone, metal tone, and photo composition, assigns standard SKUs (e.g. RING-EM-001), 
              and handles categorization with zero manual data entry.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadReferenceTestPhotos}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
            >
              Load 4 Test Jewelry Photos
            </button>
          </div>
        </div>

        {/* Confidence Rule Reminder */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E2C799] flex items-start gap-3 text-xs text-[#785412]">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#B8860B] mt-0.5" />
          <div className="leading-relaxed">
            <strong>Strict Review Policy:</strong> High-confidence photos (≥ 85% certainty on type & gemstone) are published automatically. 
            Any uncertain or ambiguous piece is safely held in the <strong>Needs Review</strong> queue for 1-tap confirmation before appearing to customers.
          </div>
        </div>
      </div>

      {/* Progress Dashboard - Uploaded / Processing / Done Count */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-stone-500">
            Total Photos
          </div>
          <div className="font-serif text-2xl sm:text-3xl text-stone-900 mt-1">
            {totalCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-stone-500">
            Uploaded
          </div>
          <div className="font-serif text-2xl sm:text-3xl text-stone-900 mt-1">
            {uploadedCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-700 flex items-center gap-1">
            <Loader2 className={`w-3 h-3 ${processingCount > 0 ? 'animate-spin' : ''}`} />
            Processing
          </div>
          <div className="font-serif text-2xl sm:text-3xl text-blue-900 mt-1">
            {processingCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Auto-Published
          </div>
          <div className="font-serif text-2xl sm:text-3xl text-emerald-900 mt-1">
            {autoPublishedCount}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-white border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Needs Review
          </div>
          <div className="font-serif text-2xl sm:text-3xl text-amber-900 mt-1">
            {needsReviewCount}
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddFiles(e.dataTransfer.files);
          }
        }}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          isDragOver
            ? 'border-[#D4AF37] bg-[#F7EFE2]/50 scale-[1.01]'
            : 'border-stone-300 hover:border-[#D4AF37] bg-white'
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#B8860B] shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-serif text-xl sm:text-2xl text-stone-900">
              Drag & Drop Jewelry Photos Here
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Supports batch files, photo folders, or ZIP archives (JPG, PNG, WEBP)
            </p>
          </div>

          {/* Trigger inputs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Select Photos</span>
            </button>

            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderUp className="w-3.5 h-3.5 text-[#8C6218]" />
              <span>Upload Folder</span>
            </button>

            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            />
            <button
              onClick={() => zipInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileArchive className="w-3.5 h-3.5 text-[#8C6218]" />
              <span>Upload ZIP Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Processing Action & Progress Bar */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-serif text-lg text-stone-900">
                Batch Upload Queue ({queue.length} items)
              </h4>
              <p className="text-xs text-stone-500">
                {doneCount === totalCount
                  ? 'All items in this batch have been processed.'
                  : `${queue.filter((q) => q.status === 'pending').length} items ready for AI categorization.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {doneCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Clear Completed
                </button>
              )}

              {queue.some((q) => q.status === 'pending') && (
                <button
                  onClick={startBatchProcessing}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider bg-[#8C6218] text-white hover:bg-[#704d10] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FAF6EE]" />
                      <span>Categorizing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#FFE699]" />
                      <span>Start AI Auto-Categorize Batch</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (autoPublishedCount / totalCount) * 100 : 0}%`,
              }}
              title="Auto-Published"
            />
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (needsReviewCount / totalCount) * 100 : 0}%`,
              }}
              title="Needs Review"
            />
            <div
              className="bg-blue-500 h-full transition-all duration-300 animate-pulse"
              style={{
                width: `${totalCount > 0 ? (processingCount / totalCount) * 100 : 0}%`,
              }}
              title="Processing"
            />
          </div>

          {/* Quick status navigation helpers if batch complete */}
          {needsReviewCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>
                  <strong>{needsReviewCount}</strong> piece{needsReviewCount > 1 ? 's' : ''} flagged for verification in the Needs Review queue.
                </span>
              </span>
              <button
                onClick={onNavigateToNeedsReview}
                className="font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Review Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Queued Photos List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 max-h-[480px] overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors"
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover bg-stone-200 border border-stone-300 shrink-0"
                />

                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-medium text-stone-900 truncate">{item.name}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {(item.size / 1024).toFixed(0)} KB
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}

                    {item.status === 'processing' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI Analyzing...
                      </span>
                    )}

                    {item.status === 'done' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Published ({item.resultItem?.sku})
                        </span>
                        <div className="text-[10px] text-stone-500 truncate">
                          {item.resultItem?.combinationCategory} &bull; {item.resultItem?.metalColor}
                        </div>
                      </div>
                    )}

                    {item.status === 'needs_review' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Needs Review
                        </span>
                        <div className="text-[10px] text-stone-500 truncate">
                          Guess: {item.resultItem?.jewelryType} ({item.resultItem?.gemstone})
                        </div>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" />
                        {item.errorMessage || 'Error'}
                      </span>
                    )}
                  </div>
                </div>

                {item.status === 'pending' && (
                  <button
                    onClick={() => removeQueueItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
