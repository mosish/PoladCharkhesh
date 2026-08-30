import React, { useState } from 'react';
import { 
  AlertCircle, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  PhoneCall, 
  MessageCircle, 
  Layers, 
  HelpCircle 
} from 'lucide-react';
import { Language } from '../types';
import { COMPANY_INFO, createWhatsAppInquiryUrl } from '../data/company';

interface ProductNotFoundProps {
  language: Language;
  searchedSlug?: string;
  onReturnToCatalog: (searchQuery?: string) => void;
}

export const ProductNotFound: React.FC<ProductNotFoundProps> = ({
  language,
  searchedSlug = '',
  onReturnToCatalog,
}) => {
  const [searchInput, setSearchInput] = useState(searchedSlug.replace(/-/g, ' '));
  const isRtl = language === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReturnToCatalog(searchInput.trim());
  };

  const whatsappInquiryUrl = createWhatsAppInquiryUrl({
    customMessage: isRtl
      ? `سلام، در خصوص استعلام و بررسی امکان تأمین بیرینگ/کاسه نمد با کد «${searchedSlug}» راهنمایی می‌خواستم.`
      : `Hello, I would like to inquire about the technical availability and specification for component code: "${searchedSlug}".`,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xl bg-white/90 space-y-8">
        
        {/* Icon & Status */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm mx-auto animate-bounce duration-1000">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 font-mono-spec">
            HTTP 404 — COMPONENT NOT FOUND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRtl ? 'کد یا قطعه درخواستی در کاتالوگ آنلاین یافت نشد' : 'Requested Component Not Found in Online Catalog'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {isRtl
              ? `کد فنی «${searchedSlug}» ممکن است تحت پسوند اختصاصی شرکت دیگری (مانند پسوندهای خاص SKF یا FAG) نام‌گذاری شده باشد یا جزو قطعات سفارشی/نایاب صنعتی باشد.`
              : `The component designation "${searchedSlug}" might be listed under an alternative manufacturer suffix (e.g. SKF/FAG proprietary prefix) or requires custom procurement.`}
          </p>
        </div>

        {/* Quick Search Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className={`w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isRtl ? 'جستجوی کد مشابه (مثلاً 6204 یا 22212)...' : 'Search similar code (e.g. 6204 or 22212)...'}
              className={`w-full py-3.5 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#232c86] font-mono-spec`}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-[#232c86] hover:bg-[#1a226b] text-white text-sm font-bold rounded-2xl transition-all shadow-md flex-shrink-0 cursor-pointer"
          >
            {isRtl ? 'جستجو' : 'Search'}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onReturnToCatalog()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl transition-all shadow cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
            <span>{isRtl ? 'بازگشت به کاتالوگ جامع' : 'Return to Catalog'}</span>
          </button>

          <a
            href={COMPANY_INFO.primaryPhoneTel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-[#232c86] text-sm font-bold rounded-2xl border border-blue-200/80 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isRtl ? `استعلام تلفنی: ${COMPANY_INFO.primaryPhoneDisplayFa}` : `Call: ${COMPANY_INFO.primaryPhoneDisplayEn}`}</span>
          </a>

          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl transition-all shadow cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isRtl ? 'استعلام فنی در واتس‌اپ' : 'WhatsApp Inquiry'}</span>
          </a>
        </div>

        {/* Assurance Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 max-w-md mx-auto pt-2">
          <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>
            {isRtl
              ? 'واحد فنی پولاد چرخِش امکان شناسایی، معادل‌یابی و واردات مستقیم انواع بیرینگ‌های نامتعارف را داراست.'
              : 'Our engineering desk specializes in cross-referencing and custom sourcing non-standard bearing types.'}
          </span>
        </div>

      </div>
    </div>
  );
};
