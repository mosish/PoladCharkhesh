import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { InquiryLog, InquiryStatus } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { Search, MessageSquareText, Phone, Mail, Building2, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminInquiriesProps {
  language: Language;
}

const statusOptions: InquiryStatus[] = ['new', 'reviewed', 'contacted', 'closed'];

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [items, setItems] = useState<InquiryLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success?: string; error?: string }>({});

  useEffect(() => {
    dataService.refreshFromServer();
    const unsub = dataService.subscribeToInquiries(setItems);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return [item.fullName, item.phone, item.company, item.email, item.message]
        .some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [items, search, statusFilter]);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    setBusyId(id);
    setMessage({});
    const result = await dataService.updateInquiryStatus(id, status);
    if (result.success) {
      setMessage({ success: isFa ? 'وضعیت استعلام ذخیره شد.' : 'Inquiry status updated.' });
    } else {
      setMessage({ error: isFa ? 'به‌روزرسانی وضعیت انجام نشد.' : 'Failed to update inquiry status.' });
    }
    setBusyId(null);
  };

  const statusLabel = (status: InquiryStatus) => {
    const labels: Record<InquiryStatus, [string, string]> = {
      new: ['جدید', 'New'],
      reviewed: ['بررسی‌شده', 'Reviewed'],
      contacted: ['تماس گرفته شد', 'Contacted'],
      closed: ['بسته‌شده', 'Closed'],
    };
    return isFa ? labels[status][0] : labels[status][1];
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <MessageSquareText className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'پیام‌ها و استعلام‌های مشتریان' : 'Customer Inquiries'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa ? 'پیگیری درخواست‌های ثبت‌شده از فرم سایت و وضعیت تماس با مشتری' : 'Triage website inquiries and track follow-up status.'}
          </p>
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-mono text-white font-bold">{items.length}</span> {isFa ? 'استعلام ثبت‌شده' : 'records'}
        </div>
      </div>

      {(message.success || message.error) && (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${message.error ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          {message.error || message.success}
        </div>
      )}

      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isFa ? 'جستجو بر اساس نام، تلفن، شرکت، ایمیل یا پیام...' : 'Search name, phone, company, email or message...'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | InquiryStatus)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All statuses'}</option>
            {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <button
            type="button"
            onClick={() => dataService.refreshFromServer()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            {isFa ? 'نوسازی' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">{isFa ? 'استعلامی با این فیلتر یافت نشد.' : 'No inquiries match these filters.'}</div>
          ) : filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400">
                    <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1 hover:text-white"><Phone className="w-3.5 h-3.5" />{item.phone}</a>
                    {item.email && <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1 hover:text-white"><Mail className="w-3.5 h-3.5" />{item.email}</a>}
                    {item.company && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{item.company}</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(item.timestamp).toLocaleString(isFa ? 'fa-IR' : 'en-US')}</span>
                  </div>
                </div>

                <select
                  value={item.status}
                  disabled={busyId === item.id}
                  onChange={(e) => updateStatus(item.id, e.target.value as InquiryStatus)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                >
                  {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-300 whitespace-pre-wrap leading-6">
                {item.message}
              </div>

              {item.status === 'closed' && (
                <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />{isFa ? 'این استعلام بسته شده است.' : 'This inquiry is closed.'}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
