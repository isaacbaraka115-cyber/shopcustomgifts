import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Trash2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronRight,
} from 'lucide-react';
import { CatalogueItem, JewelryType, Gemstone, MetalColor, PhotoStyle } from '../types';

interface NeedsReviewQueueProps {
  items: CatalogueItem[];
  onItemPublished: (item: CatalogueItem) => void;
  onItemDeleted: (id: string) => void;
  onNavigateToCatalogue: () => void;
}

const JEWELRY_TYPES: JewelryType[] = ['Ring', 'Necklace', 'Bracelet', 'Earring', 'Other'];
const GEMSTONES: Gemstone[] = ['Emerald', 'Diamond', 'Sapphire', 'Ruby', 'Multi-Gemstone', 'Other'];
const METALS: MetalColor[] = ['White Gold', 'Yellow Gold', 'Rose Gold', 'Other'];
const STYLES: PhotoStyle[] = ['Worn', 'Held', 'Detail', 'Flat'];

export const NeedsReviewQueue: React.FC<NeedsReviewQueueProps> = ({
  items,
  onItemPublished,
  onItemDeleted,
  onNavigateToCatalogue,
}) => {
  // Local state for items being edited inline
  const [selectedEdits, setSelectedEdits] = useState<
    Record<
      string,
      {
        jewelryType: JewelryType;
        gemstone: Gemstone;
        metalColor: MetalColor;
        photoStyle: PhotoStyle;
        isPublishing: boolean;
      }
    >
  >({});
  const [reviewError, setReviewError] = useState<string>('');
  const [itemToDiscard, setItemToDiscard] = useState<string | null>(null);

  const getEditState = (item: CatalogueItem) => {
    return (
      selectedEdits[item.id] || {
        jewelryType: item.jewelryType,
        gemstone: item.gemstone,
        metalColor: item.metalColor,
        photoStyle: item.photoStyle,
        isPublishing: false,
      }
    );
  };

  const updateField = (
    itemId: string,
    field: 'jewelryType' | 'gemstone' | 'metalColor' | 'photoStyle',
    value: any,
    originalItem: CatalogueItem
  ) => {
    const current = getEditState(originalItem);
    setSelectedEdits((prev) => ({
      ...prev,
      [itemId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handlePublish = async (item: CatalogueItem) => {
    const edit = getEditState(item);

    setSelectedEdits((prev) => ({
      ...prev,
      [item.id]: {
        ...edit,
        isPublishing: true,
      },
    }));
    setReviewError('');

    try {
      const response = await fetch(`/api/catalogue/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jewelryType: edit.jewelryType,
          gemstone: edit.gemstone,
          metalColor: edit.metalColor,
          photoStyle: edit.photoStyle,
          status: 'published',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish item');
      }

      onItemPublished(data.item);
    } catch (err: any) {
      setReviewError(`Publishing failed: ${err.message}`);
      setSelectedEdits((prev) => ({
        ...prev,
        [item.id]: {
          ...edit,
          isPublishing: false,
        },
      }));
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/catalogue/items/${itemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onItemDeleted(itemId);
        setItemToDiscard(null);
      }
    } catch (err: any) {
      setReviewError(`Deletion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {reviewError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <span>{reviewError}</span>
          <button onClick={() => setReviewError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wider uppercase mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              Uncertain Classification Safeguard
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900">
              Needs Review Queue ({items.length})
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              When AI vision confidence falls below our certainty threshold (85%), items are paused here rather than guessed. 
              Review the photo, tap the correct type & gemstone with one click, and hit <strong>Confirm & Publish</strong>.
            </p>
          </div>

          {items.length === 0 && (
            <button
              onClick={onNavigateToCatalogue}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <span>View Published Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl text-stone-900">Review Queue Clear</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            All uploaded jewelry pieces have either met high AI confidence criteria or have been verified and published to the customer catalogue.
          </p>
          <button
            onClick={onNavigateToCatalogue}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FAF6EE] text-[#8C6218] border border-[#E2C799] hover:bg-[#F3ECE1] transition-colors cursor-pointer"
          >
            Go to Published Catalogue
          </button>
        </div>
      ) : (
        /* List of Items Needing Review */
        <div className="space-y-6">
          {items.map((item) => {
            const edit = getEditState(item);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-amber-200/80 hover:border-amber-400 p-5 sm:p-7 shadow-xs transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Photo Column */}
                  <div className="md:col-span-4 lg:col-span-3">
                    <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs">
                      <img
                        src={item.imageUrl}
                        alt="Item needing review"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-[#D4AF37] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                        SKU: {item.sku}
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnosis and One-Tap Controls */}
                  <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-5">
                    {/* AI Assessment Bar */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>AI Assessment: Flagged for Verification</span>
                        </span>
                        <span className="font-mono text-[11px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-950">
                          Confidence: {Math.round((item.confidence?.overall || 0.6) * 100)}%
                        </span>
                      </div>
                      <div className="text-amber-800 text-[11px] leading-relaxed">
                        <strong>AI's Best Guess:</strong> {item.jewelryType} ({Math.round((item.confidence?.jewelryType || 0.6) * 100)}% cert) &bull;{' '}
                        {item.gemstone} ({Math.round((item.confidence?.gemstone || 0.5) * 100)}% cert)
                      </div>
                      {item.confidence?.reasoning && (
                        <div className="text-stone-600 text-[11px] italic pt-0.5">
                          Note: &ldquo;{item.confidence.reasoning}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* One-Tap Controls */}
                    <div className="space-y-4">
                      {/* 1. Jewelry Type Selector */}
                      <div>
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-1.5">
                          1. Select Jewelry Type (One Tap)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {JEWELRY_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateField(item.id, 'jewelryType', type, item)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                edit.jewelryType === type
                                  ? 'bg-stone-900 text-white shadow-xs scale-102 ring-2 ring-stone-950'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Gemstone Selector */}
                      <div>
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-1.5">
                          2. Select Primary Gemstone (One Tap)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {GEMSTONES.map((gem) => (
                            <button
                              key={gem}
                              type="button"
                              onClick={() => updateField(item.id, 'gemstone', gem, item)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                edit.gemstone === gem
                                  ? 'bg-[#8C6218] text-white shadow-xs scale-102 ring-2 ring-[#B8860B]'
                                  : 'bg-[#FAF6EE] text-stone-800 border border-[#E8DFD0] hover:bg-[#F3ECE1]'
                              }`}
                            >
                              {gem}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Metal Color & Photo Style */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500 mb-1">
                            Metal Tone
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {METALS.map((metal) => (
                              <button
                                key={metal}
                                type="button"
                                onClick={() => updateField(item.id, 'metalColor', metal, item)}
                                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  edit.metalColor === metal
                                    ? 'bg-stone-800 text-white font-medium'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                              >
                                {metal}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold tracking-wider uppercase text-stone-500 mb-1">
                            Photo Composition
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {STYLES.map((style) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => updateField(item.id, 'photoStyle', style, item)}
                                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  edit.photoStyle === style
                                    ? 'bg-stone-800 text-white font-medium'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: One-Tap Publish */}
                    <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setItemToDiscard(item.id)}
                        className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePublish(item)}
                        disabled={edit.isPublishing}
                        className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider bg-stone-900 text-stone-100 hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Check className="w-4 h-4 text-[#D4AF37]" />
                        <span>{edit.isPublishing ? 'Publishing...' : 'Confirm & Publish'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-app Discard Confirmation Modal */}
      {itemToDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl border border-stone-200">
            <h4 className="font-serif text-xl text-stone-900">Discard Photo?</h4>
            <p className="text-xs text-stone-500">
              Are you sure you want to discard this photo from the review queue? This cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDiscard(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(itemToDiscard)}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
