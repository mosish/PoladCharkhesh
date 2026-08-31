import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { SeoConfig } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { 
  Globe, 
  Save, 
  CheckCircle2, 
  Search, 
  Tag, 
  ExternalLink, 
  Plus, 
  X,
  Sparkles
} from 'lucide-react';

interface AdminSeoProps {
  language: Language;
}

export const AdminSeo: React.FC<AdminSeoProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [seo, setSeo] = useState<SeoConfig>(dataService.getSeoConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribeToSeo(setSeo);
    return () => unsub();
  }, []);

  const handleChange = <K extends keyof SeoConfig>(key: K, value: SeoConfig[K]) => {
    setSeo((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddKeyword = () => {
    if (newKeywordInput.trim() && !seo.keywordsFa.includes(newKeywordInput.trim())) {
      setSeo((prev) => ({
        ...prev,
        keywordsFa: [...prev.keywordsFa, newKeywordInput.trim()],
      }));
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setSeo((prev) => ({
      ...prev,
      keywordsFa: prev.keywordsFa.filter((item) => item !== kw),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateSeoConfig(seo, 'admin');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'تنظیمات سئو و متاتگ‌های موتورهای جستجو' : 'SEO & Search Engine Meta Tags'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'پیکربندی عناوین متاتگ، توضیحات گوگل، پروتکل OpenGraph و کلمات کلیدی رولبرینگ‌ها' 
              : 'Configure page meta titles, descriptions, canonical URL, and OpenGraph tags'}
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFa ? 'تنظیمات سئو ذخیره شد.' : 'SEO config saved.'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: SEO Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'عناوین و توضیحات متاتگ (Meta Data)' : 'Meta Title & Description'}</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'عنوان اصلی صفحه در گوگل (Site Title Fa)' : 'Main Site Title (Fa)'}
              </label>
              <input
                type="text"
                value={seo.defaultTitleFa}
                onChange={(e) => handleChange('defaultTitleFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'توضیحات متای گوگل (Meta Description Fa)' : 'Meta Description (Fa)'}
              </label>
              <textarea
                value={seo.defaultDescriptionFa}
                onChange={(e) => handleChange('defaultDescriptionFa', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {isFa ? `تعداد کاراکتر: ${seo.defaultDescriptionFa.length} (توصیه استاندارد: ۱۲۰ تا ۱۶۰ کاراکتر)` : `Length: ${seo.defaultDescriptionFa.length} chars`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'آدرس کانونیکال پایه (Canonical Base URL)' : 'Canonical Base URL'}
                </label>
                <input
                  type="text"
                  value={seo.canonicalBaseUrl}
                  onChange={(e) => handleChange('canonicalBaseUrl', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'تصویر اشتراک‌گذاری در شبکه‌های اجتماعی (OG Image)' : 'OpenGraph Image URL'}
                </label>
                <input
                  type="text"
                  value={seo.ogImageUrl}
                  onChange={(e) => handleChange('ogImageUrl', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'کلمات کلیدی اصلی (SEO Keywords)' : 'Target Keywords'}</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {seo.keywordsFa.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-rose-400 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                placeholder="مثال: خرید رولبرینگ صنعتی، بلبرینگ SKF اصل"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            {isFa ? 'ذخیره تنظیمات سئو' : 'Save SEO Configuration'}
          </button>

        </form>

        {/* Right: Google SERP Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'پیش‌نمایش در نتایج گوگل (Google SERP)' : 'Google Search Result Preview'}</span>
            </h3>

            {/* Google Snippet Card */}
            <div className="bg-white rounded-xl p-4 shadow-md text-start font-sans" dir="rtl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700">
                  PC
                </div>
                <div className="text-[11px] text-slate-700 font-mono truncate" dir="ltr">
                  {seo.canonicalBaseUrl || 'https://poladcharkhesh.ir'}
                </div>
              </div>

              <h4 className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 leading-snug">
                {seo.siteTitleFa}
              </h4>

              <p className="text-xs text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                {seo.metaDescriptionFa}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              {isFa 
                ? '💡 نکته مهندسی: متاتگ‌های فوق در هدر index.html و تمامی اشتراک‌گذاری‌های شبکه‌های اجتماعی به صورت واکنش‌گرا درج می‌شوند.' 
                : '💡 Note: The meta tags are injected into HTML head and OpenGraph previews.'}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
