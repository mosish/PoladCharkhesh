import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { CmsContent } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { 
  FileText, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Award, 
  ShieldCheck,
  Eye
} from 'lucide-react';

interface AdminContentProps {
  language: Language;
}

export const AdminContent: React.FC<AdminContentProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [content, setContent] = useState<CmsContent>(dataService.getContent());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'about' | 'footer'>('hero');

  useEffect(() => {
    const unsub = dataService.subscribeToContent(setContent);
    return () => unsub();
  }, []);

  const handleHeroChange = (key: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value,
      },
    }));
  };

  const handleAboutChange = (key: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [key]: value,
      },
    }));
  };

  const handleFooterChange = (key: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateContent(content, 'admin');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'مدیریت محتوای متنی سایت (CMS)' : 'Page Content Management (CMS)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'ویرایش متن‌های سرصفحه (Hero)، درباره ما، فوتر و نشان‌های اعتباری بدون نیاز به کدنویسی' 
              : 'Modify Hero headlines, About Us copy, and footer disclaimers dynamically'}
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFa ? 'محتوا با موفقیت ذخیره شد.' : 'Content saved successfully.'}</span>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'hero', labelFa: 'بخش اصلی و عنوان هیرو (Hero)', labelEn: 'Hero Section' },
          { id: 'about', labelFa: 'بخش درباره ما و آمار (About)', labelEn: 'About & Stats' },
          { id: 'footer', labelFa: 'فوتر و سلب مسئولیت (Footer)', labelEn: 'Footer & Disclaimer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold transition-all
              ${activeSubTab === tab.id 
                ? 'bg-[#232c86] text-white shadow-md' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
            `}
          >
            {isFa ? tab.labelFa : tab.labelEn}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* HERO TAB */}
        {activeSubTab === 'hero' && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'عناوین و متن‌های بنر اصلی (Hero Banner)' : 'Hero Banner Texts'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'نشان برچسب بالای عنوان (Badge Fa)' : 'Top Badge (Fa)'}
                </label>
                <input
                  type="text"
                  value={content.hero.badgeFa}
                  onChange={(e) => handleHeroChange('badgeFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'نشان برچسب بالای عنوان (Badge En)' : 'Top Badge (En)'}
                </label>
                <input
                  type="text"
                  value={content.hero.badgeEn}
                  onChange={(e) => handleHeroChange('badgeEn', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'عنوان اصلی هیرو (Title Fa)' : 'Main Title (Fa)'}
                </label>
                <input
                  type="text"
                  value={content.hero.titleFa}
                  onChange={(e) => handleHeroChange('titleFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'کلمه برجسته‌شده در عنوان (Highlight Fa)' : 'Highlighted Word (Fa)'}
                </label>
                <input
                  type="text"
                  value={content.hero.titleHighlightFa}
                  onChange={(e) => handleHeroChange('titleHighlightFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'توضیحات و زیرعنوان هیرو (Subtitle Fa)' : 'Hero Subtitle (Fa)'}
              </label>
              <textarea
                value={content.hero.subtitleFa}
                onChange={(e) => handleHeroChange('subtitleFa', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'متن داخل کادر جستجوی سریع (Placeholder Fa)' : 'Search Box Placeholder (Fa)'}
              </label>
              <input
                type="text"
                value={content.hero.searchPlaceholderFa}
                onChange={(e) => handleHeroChange('searchPlaceholderFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeSubTab === 'about' && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'متن بخش معرفی و کارت‌های آماری' : 'About Us & Statistical Metrics'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'عنوان بخش درباره ما (Title Fa)' : 'About Title (Fa)'}
                </label>
                <input
                  type="text"
                  value={content.about.titleFa}
                  onChange={(e) => handleAboutChange('titleFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'نشان بالای عنوان (Badge Fa)' : 'Badge (Fa)'}
                </label>
                <input
                  type="text"
                  value={content.about.badgeFa}
                  onChange={(e) => handleAboutChange('badgeFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'پاراگراف اول معرفی شرکت (Paragraph 1 Fa)' : 'First Paragraph (Fa)'}
              </label>
              <textarea
                value={content.about.paragraph1Fa}
                onChange={(e) => handleAboutChange('paragraph1Fa', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'پاراگراف دوم معرفی شرکت (Paragraph 2 Fa)' : 'Second Paragraph (Fa)'}
              </label>
              <textarea
                value={content.about.paragraph2Fa}
                onChange={(e) => handleAboutChange('paragraph2Fa', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* FOOTER TAB */}
        {activeSubTab === 'footer' && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'متن فوتر و تذکرات حقوقی و فنی' : 'Footer & Legal Disclaimer'}</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'خلاصه معرفی شرکت در فوتر (Summary Fa)' : 'Footer Summary (Fa)'}
              </label>
              <textarea
                value={content.footer.summaryFa}
                onChange={(e) => handleFooterChange('summaryFa', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'متن حق نشر و کپی‌رایت (Copyright Fa)' : 'Copyright Notice (Fa)'}
              </label>
              <input
                type="text"
                value={content.footer.copyrightFa}
                onChange={(e) => handleFooterChange('copyrightFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'یادداشت انطباق با استاندارد مهندسی ISO 281' : 'ISO 281 Engineering Compliance Note'}
              </label>
              <textarea
                value={content.footer.isoDisclaimerFa}
                onChange={(e) => handleFooterChange('isoDisclaimerFa', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{isFa ? 'ذخیره تغییرات محتوای متنی' : 'Save Page Content'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
