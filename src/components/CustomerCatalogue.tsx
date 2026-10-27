import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  SlidersHorizontal,
  X,
  MessageSquare,
  Gem,
  PlusCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CatalogueItem, JewelryType, Gemstone, AppSettings } from '../types';

interface CustomerCatalogueProps {
  items: CatalogueItem[];
  settings: AppSettings;
  onSelectPiece: (item: CatalogueItem) => void;
  onOpenInquiry: (item: CatalogueItem) => void;
  onGoToAdmin: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const JEWELRY_TYPES: JewelryType[] = ['Ring', 'Necklace', 'Bracelet', 'Earring'];
const GEMSTONES: Gemstone[] = ['Emerald', 'Diamond', 'Sapphire', 'Ruby', 'Multi-Gemstone', 'Other'];

export const CustomerCatalogue: React.FC<CustomerCatalogueProps> = ({
  items,
  settings,
  onSelectPiece,
  onOpenInquiry,
  onGoToAdmin,
  onRefresh,
  isLoading,
}) => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedGemstone, setSelectedGemstone] = useState<string>('All');
  const [selectedCombination, setSelectedCombination] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterWornOnly, setFilterWornOnly] = useState<boolean>(false);

  // Compute available combinations dynamically from the published pieces
  const availableCombinations = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (item.combinationCategory) {
        map.set(item.combinationCategory, (map.get(item.combinationCategory) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([combo, count]) => ({
      name: combo,
      count,
    }));
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (selectedType !== 'All' && item.jewelryType !== selectedType) {
        return false;
      }

      // Gemstone filter
      if (selectedGemstone !== 'All' && item.gemstone !== selectedGemstone) {
        return false;
      }

      // Combination filter
      if (selectedCombination !== 'All' && item.combinationCategory !== selectedCombination) {
        return false;
      }

      // Worn/Held only
      if (filterWornOnly && item.photoStyle !== 'Worn' && item.photoStyle !== 'Held') {
        return false;
      }

      // Search query (matches SKU, type, gemstone, metal, title, or combination)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchType = item.jewelryType.toLowerCase().includes(query);
        const matchGem = item.gemstone.toLowerCase().includes(query);
        const matchMetal = item.metalColor.toLowerCase().includes(query);
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCombo = item.combinationCategory.toLowerCase().includes(query);
        const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchSku && !matchType && !matchGem && !matchMetal && !matchTitle && !matchCombo && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedType, selectedGemstone, selectedCombination, filterWornOnly, searchQuery]);

  const activeFiltersCount =
    (selectedType !== 'All' ? 1 : 0) +
    (selectedGemstone !== 'All' ? 1 : 0) +
    (selectedCombination !== 'All' ? 1 : 0) +
    (filterWornOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetFilters = () => {
    setSelectedType('All');
    setSelectedGemstone('All');
    setSelectedCombination('All');
    setFilterWornOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Hero Presentation */}
      <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-14 border-b border-[#E8DFD0] bg-linear-to-b from-[#FFFDF9] to-[#FAF8F5] text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5EEDB] border border-[#E2C799] text-[#8C6218] text-xs font-semibold tracking-widest uppercase mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
            Private High Jewelry Collection
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-stone-900 font-normal tracking-tight">
            {settings.businessName || 'Your Business Name'}
          </h1>
          <p className="font-serif italic text-lg sm:text-xl text-[#996515] mt-2 font-light">
            {settings.tagline || 'Exquisite Gemstones & Bespoke High Jewelry'}
          </p>
          <p className="mt-4 text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Browse our curated high jewelry catalogue. All pieces are showcased with natural daylight and on-body perspectives. Direct bespoke inquiries welcomed.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E8DFD0] p-4 sm:p-6 shadow-xs mb-8 space-y-5">
          {/* Top row: Search + Quick stats + Refresh */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search type, gemstone, SKU (e.g. RING-EM)..."
                className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-full bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-stone-500">
              <span>
                Showing <strong className="text-stone-900">{filteredItems.length}</strong> of{' '}
                <strong className="text-stone-900">{items.length}</strong> pieces
              </span>

              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh catalogue"
                className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B8860B]' : ''}`} />
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 rounded-full text-xs font-medium text-[#996515] bg-[#F7EFE2] hover:bg-[#EEDBBF] transition-colors cursor-pointer"
                >
                  Reset ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Primary Filter Tabs: Jewelry Type */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-2">
              Jewelry Type
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedType('All');
                  setSelectedCombination('All');
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  selectedType === 'All'
                    ? 'bg-stone-900 text-stone-100 shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Pieces
              </button>
              {JEWELRY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedCombination('All');
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    selectedType === type
                      ? 'bg-stone-900 text-stone-100 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {type}s
                </button>
              ))}
            </div>
          </div>

          {/* Gemstone Filters */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-2">
              Gemstone
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedGemstone('All');
                  setSelectedCombination('All');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedGemstone === 'All'
                    ? 'bg-[#8C6218] text-white shadow-xs'
                    : 'bg-[#FAF6EE] text-stone-800 border border-[#E8DFD0] hover:bg-[#F3ECE1]'
                }`}
              >
                All Gems
              </button>
              {GEMSTONES.map((gem) => (
                <button
                  key={gem}
                  onClick={() => {
                    setSelectedGemstone(gem);
                    setSelectedCombination('All');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedGemstone === gem
                      ? 'bg-[#8C6218] text-white shadow-xs'
                      : 'bg-[#FAF6EE] text-stone-800 border border-[#E8DFD0] hover:bg-[#F3ECE1]'
                  }`}
                >
                  {gem}
                </button>
              ))}
            </div>
          </div>

          {/* Combinations Filter (Type + Gemstone combinations) */}
          {availableCombinations.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                  Type + Gemstone Combinations
                </span>
                {selectedCombination !== 'All' && (
                  <button
                    onClick={() => setSelectedCombination('All')}
                    className="text-xs text-[#996515] hover:underline cursor-pointer"
                  >
                    Clear combo
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableCombinations.map((combo) => (
                  <button
                    key={combo.name}
                    onClick={() => {
                      setSelectedCombination(
                        selectedCombination === combo.name ? 'All' : combo.name
                      );
                    }}
                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCombination === combo.name
                        ? 'bg-[#D4AF37] text-stone-950 font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <span>{combo.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                      {combo.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Worn / Held Photography Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-stone-700 select-none">
              <input
                type="checkbox"
                checked={filterWornOnly}
                onChange={(e) => setFilterWornOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#B8860B] focus:ring-[#D4AF37]"
              />
              <span className="font-medium">Worn / Held on skin photos only</span>
              <span className="text-stone-400 text-[11px]">(Highlights true scale & sparkle)</span>
            </label>
          </div>
        </div>

        {/* Empty State: Empty catalogue or zero filter results */}
        {items.length === 0 ? (
          <div className="max-w-xl mx-auto py-16 px-6 text-center bg-white rounded-3xl border border-[#E8DFD0] shadow-xs space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#B8860B]">
              <Gem className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              Catalogue In Preparation
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed max-w-md mx-auto">
              Our catalogue begins with an empty vault for your authentic photos.
              No fake or placeholder inventory is loaded.
            </p>
            <div className="p-4 rounded-xl bg-[#FAF6EE]/80 border border-[#E2C799] text-xs text-[#785412] max-w-sm mx-auto text-left space-y-1.5">
              <div className="font-semibold uppercase tracking-wider text-[10px]">
                Owner Quick-Start:
              </div>
              <div>&bull; Switch to the <strong>Admin Portal</strong> above</div>
              <div>&bull; Drag & drop photos of your rings, earrings, necklaces, and bracelets</div>
              <div>&bull; AI Vision will detect type, gemstone, metal & photo style instantly</div>
            </div>
            <button
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all text-xs font-semibold tracking-wider cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>Go to Admin & Bulk Upload Photos</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl text-stone-800">No Matching Pieces</h3>
            <p className="text-stone-500 text-sm">
              We couldn't find any pieces matching your current filter combination.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2 rounded-full bg-[#FAF6EE] text-[#8C6218] border border-[#E2C799] text-xs font-semibold hover:bg-[#F3ECE1] cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* High Luxury Jewelry Grid: 1-col mobile, 2-col tablet, 3-col desktop */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectPiece(item)}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E8DFD0] hover:border-[#D4AF37] transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Container */}
                <div className="relative aspect-4/5 w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/60 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-medium tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#D4AF37]" />
                      <span>View Specifications & Inquire</span>
                    </span>
                  </div>

                  {/* Style Badge (Worn on model vs held vs detail) */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-stone-200 text-stone-800 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-2xs">
                    {item.photoStyle}
                  </div>

                  {/* Gemstone Badge */}
                  <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-2xs">
                    {item.gemstone}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    {/* SKU & Combination category */}
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-mono font-medium text-[#8C6218] tracking-wider uppercase">
                        {item.sku}
                      </span>
                      <span className="text-stone-400 font-medium">
                        {item.jewelryType} &bull; {item.metalColor}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-stone-900 font-normal group-hover:text-stone-700 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Curated Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF6EE] text-[#8C6218] border border-[#E8DFD0]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inquiry action bar - STRICTLY NO PRICES */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-[#8C6218] font-medium tracking-wide">
                      {item.combinationCategory}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInquiry(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Inquire</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
