import React from 'react';
import { Gem, Lock, Eye, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  settings: AppSettings;
  viewMode: 'customer' | 'admin';
  setViewMode: (mode: 'customer' | 'admin') => void;
  isAdminLoggedIn: boolean;
  needsReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  viewMode,
  setViewMode,
  isAdminLoggedIn,
  needsReviewCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8DFD0]">
      {/* Top subtle luxury bar */}
      <div className="bg-[#1C1917] text-[#D4AF37] text-[11px] font-medium tracking-[0.2em] uppercase py-1.5 px-4 text-center">
        Haute Joaillerie &bull; Curated Private Catalogue &bull; By Appointment & Inquiry
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setViewMode('customer')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center bg-white shadow-xs group-hover:border-[#996515] transition-colors">
              <Gem className="w-5 h-5 text-[#B8860B]" />
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl tracking-wide font-normal text-stone-900 group-hover:text-stone-700 transition-colors">
                {settings.businessName || 'Your Business Name'}
              </span>
              <p className="text-[10px] tracking-[0.25em] text-stone-500 uppercase -mt-1">
                {settings.tagline || 'Fine Jewelry Catalogue'}
              </p>
            </div>
          </div>

          {/* Navigation & Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {viewMode === 'admin' ? (
              <button
                onClick={() => setViewMode('customer')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium tracking-wider text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>View Customer Catalogue</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('admin')}
                className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wider bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isAdminLoggedIn ? 'Admin Portal' : 'Admin Login'}</span>
                {isAdminLoggedIn && needsReviewCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500 text-stone-950 font-bold rounded-full">
                    {needsReviewCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
