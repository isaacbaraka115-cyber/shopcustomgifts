import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerCatalogue } from './components/CustomerCatalogue';
import { AdminPortal } from './components/AdminPortal';
import { PieceDetailModal } from './components/PieceDetailModal';
import { InquiryModal } from './components/InquiryModal';
import { CatalogueItem, CustomerInquiry, AppSettings } from './types';
import { Gem, Shield, Heart } from 'lucide-react';

const defaultSettings: AppSettings = {
  businessName: 'Your Business Name',
  tagline: 'High Jewelry & Rare Gemstones',
  contactEmail: 'concierge@finejewelry.com',
  contactPhone: '+1 (555) 234-5678',
  inquiryPromptText:
    'Interested in this bespoke piece? Share your details to arrange a private viewing or speak with our gemologist.',
  adminPasscode: 'admin123',
};

export default function App() {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('jewelry_admin_auth') === 'true';
  });
  const [selectedPieceForModal, setSelectedPieceForModal] = useState<CatalogueItem | null>(null);
  const [selectedPieceForInquiry, setSelectedPieceForInquiry] = useState<CatalogueItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync login status to sessionStorage
  useEffect(() => {
    if (isAdminLoggedIn) {
      sessionStorage.setItem('jewelry_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('jewelry_admin_auth');
    }
  }, [isAdminLoggedIn]);

  // Fetch initial catalogue and settings from the database
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/catalogue');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }

      // If admin logged in, fetch inquiries too
      if (isAdminLoggedIn) {
        const inqRes = await fetch('/api/inquiries');
        const inqData = await inqRes.json();
        if (inqData.inquiries) {
          setInquiries(inqData.inquiries);
        }
      }
    } catch (err) {
      console.error('Failed to load catalogue data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdminLoggedIn]);

  // Inquiries fetcher
  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (e) {
      console.error('Failed to load inquiries', e);
    }
  };

  // Callback when a batch upload produces an item
  const handleBatchItemComplete = (newItem: CatalogueItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === newItem.id);
      if (exists) {
        return prev.map((i) => (i.id === newItem.id ? newItem : i));
      }
      return [newItem, ...prev];
    });
  };

  // Callback when an item is updated or published from Needs Review
  const handleItemUpdated = (updatedItem: CatalogueItem) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    // If it was being viewed in modal, update that too
    if (selectedPieceForModal?.id === updatedItem.id) {
      setSelectedPieceForModal(updatedItem);
    }
  };

  // Callback when multiple items are updated (e.g. shared tag assignment)
  const handleItemsUpdated = (updatedItems: CatalogueItem[]) => {
    const map = new Map(updatedItems.map((item) => [item.id, item]));
    setItems((prev) => prev.map((item) => (map.has(item.id) ? map.get(item.id)! : item)));
    if (selectedPieceForModal && map.has(selectedPieceForModal.id)) {
      setSelectedPieceForModal(map.get(selectedPieceForModal.id)!);
    }
  };

  // Callback when an item is deleted
  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedPieceForModal?.id === id) {
      setSelectedPieceForModal(null);
    }
  };

  // Callback when multiple items are deleted
  const handleItemsDeleted = (ids: string[]) => {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
    if (selectedPieceForModal && idSet.has(selectedPieceForModal.id)) {
      setSelectedPieceForModal(null);
    }
  };

  // Callback when inquiry status changes
  const handleUpdateInquiryStatus = async (
    id: string,
    status: 'unread' | 'read' | 'replied'
  ) => {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const needsReviewCount = items.filter((i) => i.status === 'needs_review').length;
  const publishedItems = items.filter((i) => i.status === 'published');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-[#E2C799] selection:text-stone-950">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isAdminLoggedIn={isAdminLoggedIn}
        needsReviewCount={needsReviewCount}
      />

      {/* Main View Router: Customer vs Admin */}
      <div className="flex-1">
        {viewMode === 'customer' ? (
          <CustomerCatalogue
            items={publishedItems}
            settings={settings}
            onSelectPiece={(piece) => setSelectedPieceForModal(piece)}
            onOpenInquiry={(piece) => setSelectedPieceForInquiry(piece)}
            onGoToAdmin={() => setViewMode('admin')}
            onRefresh={loadData}
            isLoading={isLoading}
          />
        ) : (
          <AdminPortal
            items={items}
            inquiries={inquiries}
            settings={settings}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
            onItemUpdated={handleItemUpdated}
            onItemsUpdated={handleItemsUpdated}
            onItemDeleted={handleItemDeleted}
            onItemsDeleted={handleItemsDeleted}
            onBatchItemComplete={handleBatchItemComplete}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
            onSaveSettings={handleSaveSettings}
            onSelectPiece={(piece) => setSelectedPieceForModal(piece)}
            onExitToCustomerView={() => setViewMode('customer')}
          />
        )}
      </div>

      {/* Piece Detail Modal */}
      {selectedPieceForModal && (
        <PieceDetailModal
          item={selectedPieceForModal}
          settings={settings}
          onClose={() => setSelectedPieceForModal(null)}
          onOpenInquiry={(piece) => {
            setSelectedPieceForInquiry(piece);
          }}
        />
      )}

      {/* Inquiry Modal */}
      {selectedPieceForInquiry && (
        <InquiryModal
          item={selectedPieceForInquiry}
          settings={settings}
          onClose={() => {
            setSelectedPieceForInquiry(null);
            loadInquiries();
          }}
        />
      )}

      {/* Luxury Minimalist Footer */}
      <footer className="border-t border-[#E8DFD0] bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center bg-white">
              <Gem className="w-4 h-4 text-[#B8860B]" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-wide text-stone-900 block">
                {settings.businessName || 'Your Business Name'}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-stone-500">
                Curated Private Catalogue &bull; Non-Transactional
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-500 max-w-md">
            All jewelry pieces featured are handcrafted originals. Inquiries are handled privately by our dedicated concierge. No online transactions or card processing.
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-600">
            {viewMode === 'customer' ? (
              <button
                onClick={() => setViewMode('admin')}
                className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer underline"
              >
                Owner Portal Access
              </button>
            ) : (
              <button
                onClick={() => setViewMode('customer')}
                className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer underline"
              >
                Customer View
              </button>
            )}
            <span>&bull;</span>
            <span className="text-stone-400">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
