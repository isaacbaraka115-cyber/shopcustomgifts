import React, { useState } from 'react';
import { X, Sparkles, MessageCircle, Shield, Award, Maximize2, ChevronRight, User, Eye, Layers } from 'lucide-react';
import { CatalogueItem, AppSettings } from '../types';

interface PieceDetailModalProps {
  item: CatalogueItem;
  settings: AppSettings;
  onClose: () => void;
  onOpenInquiry: (item: CatalogueItem) => void;
}

export const PieceDetailModal: React.FC<PieceDetailModalProps> = ({
  item,
  settings,
  onClose,
  onOpenInquiry,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Combine main photo with additional images if present
  const allImages = [item.imageUrl, ...(item.additionalImages || [])];

  const getStyleBadgeInfo = (style: string) => {
    switch (style) {
      case 'Worn':
        return { label: 'Worn on Skin / Model', icon: <User className="w-3.5 h-3.5" /> };
      case 'Held':
        return { label: 'Held in Hand', icon: <Eye className="w-3.5 h-3.5" /> };
      case 'Detail':
        return { label: 'Macro Detail / Prongs', icon: <Layers className="w-3.5 h-3.5" /> };
      case 'Flat':
        return { label: 'Lay-Flat Composition', icon: <Award className="w-3.5 h-3.5" /> };
      default:
        return { label: style, icon: <Sparkles className="w-3.5 h-3.5" /> };
    }
  };

  const styleBadge = getStyleBadgeInfo(item.photoStyle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#E2C799] overflow-hidden my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 text-stone-700 hover:text-stone-950 hover:bg-white flex items-center justify-center transition-all shadow-sm"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          {/* Left Column: Photos Gallery */}
          <div className="md:col-span-7 bg-stone-900 flex flex-col justify-between p-4 sm:p-8 relative">
            {/* Main Active Image */}
            <div className="relative aspect-4/5 w-full rounded-2xl overflow-hidden bg-stone-950 flex items-center justify-center border border-stone-800">
              <img
                src={allImages[selectedPhotoIndex]}
                alt={item.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-medium tracking-wider flex items-center gap-1.5 shadow-sm">
                {styleBadge.icon}
                <span>{styleBadge.label}</span>
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedPhotoIndex === idx
                        ? 'border-[#D4AF37] scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Gallery thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
              <span className="tracking-widest uppercase">Catalogue Master Reference</span>
              <span className="font-mono text-[#D4AF37]">{item.sku}</span>
            </div>
          </div>

          {/* Right Column: Piece Specifications & Inquiry Action */}
          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#FAF8F5]">
            <div className="space-y-6">
              {/* Category Breadcrumb */}
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#996515]">
                  <span>{item.jewelryType}</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                  <span>{item.gemstone}</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                  <span>{item.combinationCategory}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal mt-1 leading-tight">
                  {item.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#F3ECE1] text-[#785412] border border-[#E2C799]">
                    SKU: {item.sku}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {item.combinationCategory}
                  </span>
                </div>

                {/* Assigned Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF6EE] text-[#8C6218] border border-[#E2C799]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="text-stone-700 text-sm leading-relaxed border-t border-b border-stone-200/80 py-4">
                <p>{item.description}</p>
                {item.confidence?.reasoning && (
                  <p className="mt-3 text-xs text-stone-500 italic bg-stone-100/80 p-2.5 rounded-lg border border-stone-200">
                    &ldquo;{item.confidence.reasoning}&rdquo;
                  </p>
                )}
              </div>

              {/* Specifications Matrix */}
              <div className="space-y-3">
                <h4 className="text-[11px] tracking-[0.15em] uppercase font-bold text-stone-500">
                  Piece Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <span className="block text-[10px] tracking-wider uppercase text-stone-500">
                      Jewelry Type
                    </span>
                    <span className="font-serif text-lg font-medium text-stone-900">
                      {item.jewelryType}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <span className="block text-[10px] tracking-wider uppercase text-stone-500">
                      Primary Gemstone
                    </span>
                    <span className="font-serif text-lg font-medium text-stone-900">
                      {item.gemstone}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <span className="block text-[10px] tracking-wider uppercase text-stone-500">
                      Metal Finish
                    </span>
                    <span className="font-serif text-lg font-medium text-stone-900">
                      {item.metalColor}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <span className="block text-[10px] tracking-wider uppercase text-stone-500">
                      Photo Composition
                    </span>
                    <span className="font-serif text-lg font-medium text-stone-900">
                      {item.photoStyle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy note */}
              <div className="p-3.5 rounded-xl bg-[#F7EFE2]/60 border border-[#E2C799] text-xs text-[#785412] flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#B8860B]" />
                <p className="leading-snug">
                  This is a bespoke curated catalogue piece. Pricing is available exclusively upon private inquiry or appointment.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-stone-200">
              <button
                onClick={() => onOpenInquiry(item)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all font-medium text-sm tracking-wider cursor-pointer shadow-md group"
              >
                <MessageCircle className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>Ask About This Piece</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
