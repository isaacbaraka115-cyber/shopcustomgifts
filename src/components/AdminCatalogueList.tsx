import React, { useState, useMemo } from 'react';
import {
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Filter,
  Tag,
  CheckSquare,
  Square,
  MinusSquare,
  Plus,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { CatalogueItem } from '../types';

interface AdminCatalogueListProps {
  items: CatalogueItem[];
  onItemDeleted: (id: string) => void;
  onItemsDeleted: (ids: string[]) => void;
  onItemsUpdated: (updatedItems: CatalogueItem[]) => void;
  onSelectPiece: (item: CatalogueItem) => void;
}

const PRESET_TAGS = [
  'High Jewelry',
  'New Arrival',
  'Bridal',
  'Bespoke',
  'Vintage',
  'Solitaire',
  'Statement Piece',
  'Signature Collection',
  'Private Vault',
  'Limited Edition',
];

export const AdminCatalogueList: React.FC<AdminCatalogueListProps> = ({
  items,
  onItemDeleted,
  onItemsDeleted,
  onItemsUpdated,
  onSelectPiece,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  // Bulk edit state
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [singleItemToDelete, setSingleItemToDelete] = useState<string | null>(null);

  // Extract all unique tags present across items
  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [items]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'All' && item.jewelryType !== typeFilter) return false;
      if (tagFilter !== 'All') {
        if (!item.tags || !item.tags.includes(tagFilter)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesGem = item.gemstone.toLowerCase().includes(q);
        const matchesCategory = item.combinationCategory.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesSku || matchesTitle || matchesGem || matchesCategory || matchesTags;
      }
      return true;
    });
  }, [items, typeFilter, tagFilter, search]);

  // Selection helpers
  const isAllSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));
  const isSomeSelected =
    filtered.some((item) => selectedIds.includes(item.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect filtered items
      const filteredIdSet = new Set(filtered.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // Select all filtered items
      const combined = new Set([...selectedIds, ...filtered.map((i) => i.id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Bulk Delete Action
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/catalogue/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete items');

      onItemsDeleted(selectedIds);
      setSuccessBanner(`Successfully deleted ${data.deletedCount} pieces from the catalogue.`);
      setSelectedIds([]);
      setIsDeleteConfirmOpen(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(`Deletion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Assign Tag Action
  const handleApplyTag = async (tagToApply: string, mode: 'add' | 'remove' = 'add') => {
    if (selectedIds.length === 0 || !tagToApply.trim()) return;
    setIsProcessing(true);
    setErrorBanner('');

    try {
      const res = await fetch('/api/catalogue/bulk-assign-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          tag: tagToApply.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tags');

      if (data.updatedItems) {
        onItemsUpdated(data.updatedItems);
      }

      setSuccessBanner(
        mode === 'add'
          ? `Added tag "${tagToApply.trim()}" to ${selectedIds.length} pieces.`
          : `Removed tag "${tagToApply.trim()}" from ${selectedIds.length} pieces.`
      );
      setCustomTagInput('');
      setIsTagModalOpen(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(`Tag assignment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Item Delete
  const confirmDeleteSingle = async (id: string) => {
    try {
      const res = await fetch(`/api/catalogue/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onItemDeleted(id);
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        setSingleItemToDelete(null);
        setSuccessBanner('Piece successfully removed from catalogue.');
        setTimeout(() => setSuccessBanner(''), 3000);
      }
    } catch (err: any) {
      setErrorBanner(`Delete failed: ${err.message}`);
    }
  };

  // Export Catalogue Data to CSV
  const exportToCsv = (itemsToExport: CatalogueItem[], suffix = 'catalogue') => {
    if (itemsToExport.length === 0) {
      setErrorBanner('No pieces available to export.');
      return;
    }

    const headers = [
      'SKU',
      'Title',
      'Jewelry Type',
      'Gemstone',
      'Combination Category',
      'Metal Color',
      'Photo Style',
      'Tags',
      'Status',
      'Type Confidence (%)',
      'Gemstone Confidence (%)',
      'Description',
      'Created At',
    ];

    const escapeField = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = itemsToExport.map((item) => [
      escapeField(item.sku),
      escapeField(item.title),
      escapeField(item.jewelryType),
      escapeField(item.gemstone),
      escapeField(item.combinationCategory),
      escapeField(item.metalColor),
      escapeField(item.photoStyle),
      escapeField(item.tags?.join('; ') || ''),
      escapeField(item.status),
      escapeField(item.confidence?.jewelryType ? Math.round(item.confidence.jewelryType * 100) : ''),
      escapeField(item.confidence?.gemstone ? Math.round(item.confidence.gemstone * 100) : ''),
      escapeField(item.description),
      escapeField(new Date(item.createdAt).toLocaleString()),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `jewelry_${suffix}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessBanner(`Exported ${itemsToExport.length} catalogue item${itemsToExport.length > 1 ? 's' : ''} to CSV file.`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner('')}
            className="text-red-600 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-stone-900">
                Published Inventory ({items.length})
              </h2>
              {isBulkEditMode && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#F5EEDB] text-[#8C6218] border border-[#E2C799]">
                  Bulk Edit Mode Active
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {isBulkEditMode
                ? 'Select pieces with the checkboxes below to assign shared tags or delete in batches.'
                : 'Active pieces published and visible to customers in the public catalogue.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Export CSV button */}
            <button
              onClick={() => exportToCsv(filtered, filtered.length === items.length ? 'all' : 'filtered')}
              title="Export current catalogue items to a CSV spreadsheet"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#8C6218]" />
              <span>Export CSV ({filtered.length})</span>
            </button>

            {/* Bulk Edit Toggle Button */}
            <button
              onClick={() => {
                setIsBulkEditMode(!isBulkEditMode);
                if (isBulkEditMode) {
                  setSelectedIds([]);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                isBulkEditMode
                  ? 'bg-[#8C6218] text-white shadow-sm ring-2 ring-[#B8860B]/40'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit Mode'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU, title, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-hidden"
            >
              <option value="All">All Types</option>
              <option value="Ring">Rings</option>
              <option value="Necklace">Necklaces</option>
              <option value="Bracelet">Bracelets</option>
              <option value="Earring">Earrings</option>
            </select>

            {allExistingTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-hidden"
              >
                <option value="All">All Tags</option>
                {allExistingTags.map((t) => (
                  <option key={t} value={t}>
                    Tag: {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-stone-500 self-center">
            Showing <strong className="text-stone-800">{filtered.length}</strong> pieces
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when items are selected */}
      {isBulkEditMode && selectedIds.length > 0 && (
        <div className="sticky top-24 z-30 bg-stone-900 text-stone-100 rounded-2xl p-4 shadow-xl border border-[#D4AF37]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#8C6218] text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <div>
              <span className="font-semibold text-xs tracking-wide">
                {selectedIds.length} piece{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <span className="text-[11px] text-stone-400 block">
                Choose an action to apply to all selected items
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Assign Shared Tag */}
            <button
              onClick={() => setIsTagModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF6EE] text-[#8C6218] hover:bg-[#F3ECE1] transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Assign Shared Tag</span>
            </button>

            {/* Export Selected to CSV */}
            <button
              onClick={() => {
                const selectedItems = items.filter((i) => selectedIds.includes(i.id));
                exportToCsv(selectedItems, 'selected');
              }}
              title="Download CSV for currently selected pieces"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Export CSV ({selectedIds.length})</span>
            </button>

            {/* Bulk Delete */}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600/90 text-white hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Items List / Table */}
      {items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500 text-sm">
            No published items yet. Bulk upload photos to start populating your catalogue!
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500 text-sm">No items matching your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  {isBulkEditMode && (
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="text-stone-600 hover:text-stone-900 cursor-pointer p-1"
                        title={isAllSelected ? 'Deselect All' : 'Select All'}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#8C6218]" />
                        ) : isSomeSelected ? (
                          <MinusSquare className="w-4 h-4 text-[#8C6218]" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-3 px-4">Piece</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Gemstone</th>
                  <th className="py-3 px-4">Metal</th>
                  <th className="py-3 px-4">Assigned Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (isBulkEditMode) {
                          toggleSelectItem(item.id);
                        }
                      }}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#FAF6EE]/80'
                          : isBulkEditMode
                          ? 'hover:bg-stone-50/70 cursor-pointer'
                          : 'hover:bg-stone-50/70'
                      }`}
                    >
                      {isBulkEditMode && (
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelectItem(item.id)}
                            className="text-stone-600 hover:text-stone-900 cursor-pointer p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#8C6218]" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                          />
                          <div className="max-w-xs">
                            <div className="font-serif text-sm font-medium text-stone-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1">
                              {item.combinationCategory} &bull; {item.photoStyle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#8C6218]">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 text-stone-700">{item.jewelryType}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#8C6218] font-medium border border-[#E8DFD0]">
                          {item.gemstone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700">{item.metalColor}</td>
                      <td className="py-3 px-4">
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No tags</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectPiece(item)}
                            title="Preview piece modal"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSingleItemToDelete(item.id)}
                            title="Delete piece"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Assign Shared Tag to Selected Items */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E2C799] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#8C6218]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-stone-900">Assign Shared Tag</h3>
                  <p className="text-[11px] text-stone-500">
                    Applying to <strong className="text-stone-800">{selectedIds.length}</strong> selected pieces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Tag Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Custom Tag Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Summer Haute, Limited Vault..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTagInput.trim()) {
                      handleApplyTag(customTagInput, 'add');
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37]"
                />
                <button
                  onClick={() => customTagInput.trim() && handleApplyTag(customTagInput, 'add')}
                  disabled={!customTagInput.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-100 hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Preset Luxury Tags */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Popular Fine Jewelry Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleApplyTag(tag, 'add')}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAF6EE] text-[#8C6218] border border-[#E8DFD0] hover:bg-[#F3ECE1] hover:border-[#D4AF37] transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Option to Remove a Tag from Selected */}
            {allExistingTags.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Remove Tag from Selected
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allExistingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleApplyTag(tag, 'remove')}
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-2xl text-stone-900">Confirm Bulk Deletion</h3>
              <p className="text-xs text-stone-600">
                Are you sure you want to permanently delete{' '}
                <strong className="text-red-700">{selectedIds.length} selected pieces</strong> from the catalogue?
              </p>
              <p className="text-[11px] text-stone-400">
                This action is irreversible and will remove them immediately from the database.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Delete Confirmation */}
      {singleItemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-xl text-stone-900">Delete Piece?</h4>
              <p className="text-xs text-stone-600">
                Are you sure you want to remove this piece from the catalogue? This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSingleItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteSingle(singleItemToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
