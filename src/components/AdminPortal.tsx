import React, { useState } from 'react';
import {
  UploadCloud,
  AlertCircle,
  Package,
  MessageSquare,
  Settings,
  Lock,
  LogOut,
  Eye,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { CatalogueItem, CustomerInquiry, AppSettings } from '../types';
import { BulkUploadView } from './BulkUploadView';
import { NeedsReviewQueue } from './NeedsReviewQueue';
import { AdminCatalogueList } from './AdminCatalogueList';
import { InquiriesList } from './InquiriesList';
import { SettingsView } from './SettingsView';

interface AdminPortalProps {
  items: CatalogueItem[];
  inquiries: CustomerInquiry[];
  settings: AppSettings;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  onItemUpdated: (item: CatalogueItem) => void;
  onItemsUpdated: (items: CatalogueItem[]) => void;
  onItemDeleted: (id: string) => void;
  onItemsDeleted: (ids: string[]) => void;
  onBatchItemComplete: (item: CatalogueItem) => void;
  onUpdateInquiryStatus: (id: string, status: 'unread' | 'read' | 'replied') => void;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onSelectPiece: (item: CatalogueItem) => void;
  onExitToCustomerView: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  items,
  inquiries,
  settings,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  onItemUpdated,
  onItemsUpdated,
  onItemDeleted,
  onItemsDeleted,
  onBatchItemComplete,
  onUpdateInquiryStatus,
  onSaveSettings,
  onSelectPiece,
  onExitToCustomerView,
}) => {
  const [activeTab, setActiveTab] = useState<
    'upload' | 'review' | 'catalogue' | 'inquiries' | 'settings'
  >('upload');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const needsReviewItems = items.filter((i) => i.status === 'needs_review');
  const publishedItems = items.filter((i) => i.status === 'published');
  const unreadInquiriesCount = inquiries.filter((inq) => inq.status === 'unread').length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid passcode');
      }

      setIsAdminLoggedIn(true);
      // If there are items needing review, default to review tab, else upload
      if (needsReviewItems.length > 0) {
        setActiveTab('review');
      } else {
        setActiveTab('upload');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect passcode');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setPasscode('');
  };

  // If not logged in, render authentication gate
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2C799] shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-900 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#996515] uppercase font-semibold">
              Authorized Business Access
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 mt-1">
              Admin Portal
            </h2>
            <p className="text-xs text-stone-500 mt-2">
              Please enter your business owner passcode to access bulk uploading and catalogue curation.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {authError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {authError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 disabled:opacity-50 text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Admin Portal'}
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 text-xs text-stone-400 flex items-center justify-between">
            <span>Default passcode: <code className="text-stone-700">admin123</code></span>
            <button
              onClick={onExitToCustomerView}
              className="text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              Back to Catalogue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Admin Navigation Bar */}
      <div className="bg-stone-900 text-stone-100 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
            {/* Left: Admin Status */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium tracking-wider uppercase text-stone-300">
                Owner Portal: <strong className="text-white">{settings.businessName}</strong>
              </span>
            </div>

            {/* Right: Quick actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onExitToCustomerView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Customer Catalogue</span>
              </button>

              <button
                onClick={handleLogout}
                title="Log out of Admin"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-stone-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex overflow-x-auto gap-1 border-t border-stone-800/80 py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#8C6218] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#FFE699]" />
              <span>Bulk Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-[#8C6218] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Needs Review</span>
              {needsReviewItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                  {needsReviewItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('catalogue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'catalogue'
                  ? 'bg-[#8C6218] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Package className="w-4 h-4 text-[#FFE699]" />
              <span>Published Inventory ({publishedItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-[#8C6218] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FFE699]" />
              <span>Client Inquiries</span>
              {unreadInquiriesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {unreadInquiriesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#8C6218] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4 text-[#FFE699]" />
              <span>Business Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Tab View Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <BulkUploadView
            onBatchItemComplete={onBatchItemComplete}
            onNavigateToNeedsReview={() => setActiveTab('review')}
            onNavigateToCatalogue={() => setActiveTab('catalogue')}
          />
        )}

        {activeTab === 'review' && (
          <NeedsReviewQueue
            items={needsReviewItems}
            onItemPublished={onItemUpdated}
            onItemDeleted={onItemDeleted}
            onNavigateToCatalogue={() => setActiveTab('catalogue')}
          />
        )}

        {activeTab === 'catalogue' && (
          <AdminCatalogueList
            items={publishedItems}
            onItemDeleted={onItemDeleted}
            onItemsDeleted={onItemsDeleted}
            onItemsUpdated={onItemsUpdated}
            onSelectPiece={onSelectPiece}
          />
        )}

        {activeTab === 'inquiries' && (
          <InquiriesList
            inquiries={inquiries}
            onUpdateStatus={onUpdateInquiryStatus}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={onSaveSettings}
          />
        )}
      </div>
    </div>
  );
};
