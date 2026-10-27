import React from 'react';
import { Mail, Phone, Calendar, MessageSquare, Check, Clock, User } from 'lucide-react';
import { CustomerInquiry } from '../types';

interface InquiriesListProps {
  inquiries: CustomerInquiry[];
  onUpdateStatus: (id: string, status: 'unread' | 'read' | 'replied') => void;
}

export const InquiriesList: React.FC<InquiriesListProps> = ({
  inquiries,
  onUpdateStatus,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <h2 className="font-serif text-2xl text-stone-900">
          Client Inquiries ({inquiries.length})
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Direct inquiries submitted by customers browsing the catalogue. No payments or cart involved.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
          <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No client inquiries received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`p-5 rounded-2xl border transition-all bg-white ${
                inq.status === 'unread'
                  ? 'border-amber-300 ring-1 ring-amber-200 shadow-xs'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#E2C799] flex items-center justify-center text-[#8C6218]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-900 text-sm">{inq.customerName}</h4>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      {inq.customerEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${inq.customerEmail}`} className="hover:underline">
                            {inq.customerEmail}
                          </a>
                        </span>
                      )}
                      {inq.customerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${inq.customerPhone}`} className="hover:underline">
                            {inq.customerPhone}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </span>

                  <select
                    value={inq.status}
                    onChange={(e: any) => onUpdateStatus(inq.id, e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-stone-700"
                  >
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="mt-3 flex flex-col sm:flex-row items-start gap-4">
                {inq.itemImage && (
                  <img
                    src={inq.itemImage}
                    alt={inq.itemTitle}
                    className="w-14 h-14 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-[#8C6218] bg-[#FAF6EE] px-2 py-0.5 rounded">
                      {inq.itemSku}
                    </span>
                    <span className="text-xs font-serif text-stone-800">{inq.itemTitle}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                    &ldquo;{inq.message}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
