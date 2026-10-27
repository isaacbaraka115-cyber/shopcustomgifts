import React, { useState } from 'react';
import { Save, CheckCircle, Shield, Building2, Download, FileSpreadsheet } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '');
  const [adminPasscode, setAdminPasscode] = useState(settings.adminPasscode || 'admin123');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveSettings({
      businessName,
      tagline,
      contactEmail,
      contactPhone,
      adminPasscode,
    });
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownloadCsv = () => {
    window.location.href = '/api/catalogue/export.csv';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#8C6218]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-stone-900">Brand & Catalogue Settings</h2>
            <p className="text-xs text-stone-500">
              Customize your business identity and administrative credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Aurelia Fine Jewelry, Cartier, Tiffany & Co."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Displayed on the catalogue header, inquiry modals, and browser title.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Bespoke Gemstones & Haute Joaillerie"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Concierge Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="concierge@jewelry.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Concierge Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Admin Passcode
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Passcode required to open the Admin Portal from the Customer Catalogue (Default: <code className="text-stone-700">admin123</code>).
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Settings saved successfully!</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 disabled:opacity-50 text-xs font-semibold tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Record-Keeping Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#8C6218]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-stone-900">Catalogue Data Export</h3>
            <p className="text-xs text-stone-500">
              Download your inventory data for offline bookkeeping, appraisal archives, or spreadsheet analysis.
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          The exported CSV includes SKUs, titles, jewelry types, primary gemstones, metal finishes, photo composition styles, assigned tags, AI detection confidence ratings, and creation dates. Formatted in standard UTF-8 compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-stone-900 bg-[#FAF6EE] hover:bg-[#F3ECE1] border border-[#E2C799] transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#8C6218]" />
            <span>Download Complete Catalogue CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
