import React, { useState } from 'react';
import { X, Send, CheckCircle2, ShieldCheck, Mail, Phone, MessageSquare } from 'lucide-react';
import { CatalogueItem, AppSettings } from '../types';

interface InquiryModalProps {
  item: CatalogueItem;
  settings: AppSettings;
  onClose: () => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({ item, settings, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'either'>('email');
  const [message, setMessage] = useState(
    `Hello, I would like to inquire about the ${item.title} (SKU: ${item.sku}). Please let me know more details about this piece.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setErrorMessage('Please provide an email or phone number so we can reach you.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemSku: item.sku,
          itemTitle: item.title,
          itemImage: item.imageUrl,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          preferredContact,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit your inquiry at this moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E2C799] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-900 text-stone-100">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#D4AF37] uppercase font-semibold">
              Private Concierge
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-stone-100">Ask About This Piece</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl text-stone-900">Inquiry Received</h4>
              <p className="text-stone-600 text-sm max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="font-medium text-stone-900">{name}</span>. Your inquiry regarding piece{' '}
                <span className="font-semibold text-stone-900">{item.sku}</span> has been forwarded directly to our jewelry specialist.
              </p>
              <div className="pt-2 text-xs text-stone-500">
                A private concierge will reach out to you via your preferred contact method.
              </div>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-semibold tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Piece Summary Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-wider uppercase font-bold text-[#996515] bg-[#F7EFE2] px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                    <span className="text-xs text-stone-500">{item.combinationCategory}</span>
                  </div>
                  <h4 className="font-serif text-base text-stone-900 font-medium truncate mt-0.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {item.gemstone} &bull; {item.jewelryType} &bull; {item.metalColor}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lady Katherine"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-stone-300 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-stone-300 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-stone-300 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Preferred Contact
                  </label>
                  <select
                    value={preferredContact}
                    onChange={(e: any) => setPreferredContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-stone-300 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone / WhatsApp</option>
                    <option value="either">Either</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Inquiry Details
                </label>
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-stone-300 focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                  Confidential &bull; No obligation
                </span>
                <span className="italic">Catalogue inquiry only</span>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-stone-900 text-stone-100 hover:bg-stone-800 disabled:opacity-50 text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isSubmitting ? 'Sending Inquiry...' : 'Submit Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
