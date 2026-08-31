import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { CompanyInfo, InquiryLog } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { 
  Phone, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Plus,
  Trash2
} from 'lucide-react';

interface AdminContactProps {
  language: Language;
}

export const AdminContact: React.FC<AdminContactProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [company, setCompany] = useState<CompanyInfo>(dataService.getCompanyInfo());
  const [inquiries, setInquiries] = useState<InquiryLog[]>(dataService.getInquiries());
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'سلام و درود، جهت استعلام موجودی و مشخصات فنی برینگ {code} مزاحم شدم.'
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubCompany = dataService.subscribeToCompany(setCompany);
    const unsubInquiries = dataService.subscribeToInquiries(setInquiries);
    return () => {
      unsubCompany();
      unsubInquiries();
    };
  }, []);

  const handleUpdateStatus = (id: string, status: 'new' | 'reviewed' | 'contacted' | 'closed') => {
    dataService.updateInquiryStatus(id, status);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(whatsappTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Phone className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'راه‌های ارتباطی و مدیریت استعلام‌ها' : 'Contact Channels & Inquiry Logs'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'پیکربندی الگوهای پیام واتس‌اپ، خطوط تماس تلفنی و لاگ استعلام‌های ثبت‌شده' 
              : 'Configure WhatsApp inquiry templates, phone links, and view registered inquiry logs'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: WhatsApp Template & Direct Link Generator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'الگوی پیام پیش‌فرض استعلام واتس‌اپ' : 'WhatsApp Inquiry Template'}</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'متن پیام ارسالی توسط مشتری:' : 'Customer WhatsApp Message Template:'}
              </label>
              <textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {isFa 
                  ? 'برچسب {code} در هنگام کلیک روی محصول به شماره فنی آن کالا تغییر می‌کند.' 
                  : 'The {code} placeholder is automatically replaced by the selected bearing code.'}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی الگو' : 'Copy Template')}</span>
              </button>

              <a
                href={`https://wa.me/${company.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappTemplate.replace('{code}', '30205'))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isFa ? 'تست ارسال پیام' : 'Test WhatsApp Link'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Inquiries Log */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'دفتر ثبت استعلام‌های دریافتی' : 'Inquiry Activity Ledger'}</span>
              </h3>
              <span className="text-xs font-mono text-slate-400 font-bold">
                {inquiries.length} {isFa ? 'مورد' : 'records'}
              </span>
            </div>

            <div className="divide-y divide-slate-800 max-h-[450px] overflow-y-auto">
              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {isFa ? 'تاکنون استعلام جدیدی ثبت نشده است.' : 'No recorded inquiries yet.'}
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{inq.fullName || inq.phone}</span>
                        {inq.bearingCode && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                            {inq.bearingCode}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(inq.createdAt).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}
                        </span>
                      </div>
                      {inq.message && (
                        <p className="text-slate-300 mt-1 text-[11px] line-clamp-1">{inq.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateStatus(inq.id, e.target.value as any)}
                        className={`bg-slate-900 border rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none ${
                          inq.status === 'responded' 
                            ? 'border-emerald-500/50 text-emerald-300' 
                            : inq.status === 'in_progress' 
                              ? 'border-amber-500/50 text-amber-300' 
                              : 'border-slate-700 text-slate-300'
                        }`}
                      >
                        <option value="new">{isFa ? 'جدید' : 'New'}</option>
                        <option value="in_progress">{isFa ? 'در حال بررسی' : 'In Progress'}</option>
                        <option value="responded">{isFa ? 'پاسخ داده شد' : 'Responded'}</option>
                        <option value="archived">{isFa ? 'بایگانی' : 'Archived'}</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
