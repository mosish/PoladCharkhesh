import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { CmsContent, CmsHeroContent, CmsAboutContent, CmsFooterContent } from '../../types/admin';
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
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'about' | 'sections' | 'footer'>('hero');
  const [sectionJsonError, setSectionJsonError] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribeToContent(setContent);
    return () => unsub();
  }, []);

  const handleHeroChange = (key: keyof CmsHeroContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value,
      },
    }));
  };

  const handleAboutChange = (key: keyof CmsAboutContent, value: CmsAboutContent[keyof CmsAboutContent]) => {
    setContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [key]: value,
      },
    }));
  };

  const handleFooterChange = (key: keyof CmsFooterContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [key]: value,
      },
    }));
  };

  const handleSectionChange = (
    section: 'catalog' | 'tools' | 'whyUs' | 'industries' | 'team' | 'contact',
    key: string,
    value: unknown
  ) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [key]: value,
      },
    }));
  };

  const handleJsonField = (
    section: 'whyUs' | 'industries' | 'team',
    key: 'cards' | 'items' | 'members',
    raw: string
  ) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Array expected');
      handleSectionChange(section, key, parsed);
      setSectionJsonError('');
    } catch {
      setSectionJsonError(isFa ? 'ساختار JSON این بخش معتبر نیست؛ تغییرات لیستی ذخیره نشد.' : 'Invalid JSON structure; list changes were not applied.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSavedSuccess(false);
    setIsSaving(true);

    try {
      const result = await dataService.updateContent(content, 'admin');
      if (!result.success) {
        setSaveError(isFa ? 'ذخیره محتوای سایت ناموفق بود. لطفاً اتصال سرور و داده‌های ورودی را بررسی کنید.' : 'Failed to save site content. Check the server connection and submitted data.');
        return;
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaveError(isFa ? 'خطای ارتباط با سرور هنگام ذخیره محتوای سایت.' : 'Server communication error while saving site content.');
    } finally {
      setIsSaving(false);
    }
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

        <div className="flex flex-col items-start sm:items-end gap-2">
          {savedSuccess && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isFa ? 'محتوا با موفقیت ذخیره شد.' : 'Content saved successfully.'}</span>
            </div>
          )}
          {saveError && (
            <div className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'hero', labelFa: 'بخش اصلی و عنوان هیرو (Hero)', labelEn: 'Hero Section' },
          { id: 'about', labelFa: 'بخش درباره ما و آمار (About)', labelEn: 'About & Stats' },
          { id: 'sections', labelFa: 'سکشن‌های سایت', labelEn: 'Site Sections' },
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
                  value={content.hero.titleSuffixFa}
                  onChange={(e) => handleHeroChange('titleSuffixFa', e.target.value)}
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
                value={content.hero.descriptionFa}
                onChange={(e) => handleHeroChange('descriptionFa', e.target.value)}
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
                  value={content.about.tagFa}
                  onChange={(e) => handleAboutChange('tagFa', e.target.value)}
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


        {/* OTHER PUBLIC SECTIONS TAB */}
        {activeSubTab === 'sections' && (
          <div className="space-y-5">
            {sectionJsonError && (
              <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                {sectionJsonError}
              </div>
            )}

            {([
              ['catalog', isFa ? 'کاتالوگ محصولات' : 'Product Catalog'],
              ['tools', isFa ? 'ابزارهای مهندسی' : 'Engineering Tools'],
              ['whyUs', isFa ? 'چرا پولاد چرخِش' : 'Why Us'],
              ['industries', isFa ? 'صنایع تحت پوشش' : 'Industries'],
              ['team', isFa ? 'تیم تخصصی' : 'Team'],
              ['contact', isFa ? 'تماس و استعلام' : 'Contact'],
            ] as const).map(([sectionKey, sectionLabel]) => {
              const section = (content as any)[sectionKey];
              return (
                <div key={sectionKey} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{sectionLabel}</h3>
                      <p className="text-[11px] text-slate-500 mt-1">{sectionKey}</p>
                    </div>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['tagFa','tagEn','titleFa','titleEn','subtitleFa','subtitleEn'].map((field) => field in section ? (
                      <div key={field} className={field.startsWith('subtitle') ? 'sm:col-span-2' : ''}>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">{field}</label>
                        {field.startsWith('subtitle') ? (
                          <textarea
                            value={section[field] || ''}
                            onChange={(e) => handleSectionChange(sectionKey, field, e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={section[field] || ''}
                            onChange={(e) => handleSectionChange(sectionKey, field, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          />
                        )}
                      </div>
                    ) : null)}
                  </div>

                  {sectionKey === 'whyUs' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={section.badgeFa || ''} onChange={(e) => handleSectionChange('whyUs','badgeFa',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Badge Fa" />
                        <input value={section.badgeEn || ''} onChange={(e) => handleSectionChange('whyUs','badgeEn',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Badge En" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Why Us cards (JSON)</label>
                        <textarea
                          defaultValue={JSON.stringify(section.cards, null, 2)}
                          onBlur={(e) => handleJsonField('whyUs','cards',e.target.value)}
                          rows={10}
                          dir="ltr"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {sectionKey === 'industries' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={section.recommendedLabelFa || ''} onChange={(e) => handleSectionChange('industries','recommendedLabelFa',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Recommended label Fa" />
                        <input value={section.recommendedLabelEn || ''} onChange={(e) => handleSectionChange('industries','recommendedLabelEn',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Recommended label En" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Industry items (JSON)</label>
                        <textarea defaultValue={JSON.stringify(section.items, null, 2)} onBlur={(e) => handleJsonField('industries','items',e.target.value)} rows={12} dir="ltr" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-200 font-mono focus:border-indigo-500 focus:outline-none" />
                      </div>
                    </>
                  )}

                  {sectionKey === 'team' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['experienceLabelFa','experienceLabelEn','specialtyLabelFa','specialtyLabelEn','whatsappLabelFa','whatsappLabelEn'].map((field) => (
                          <input key={field} value={section[field] || ''} onChange={(e) => handleSectionChange('team',field,e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder={field} />
                        ))}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Team members (JSON) — leave empty unless verified</label>
                        <textarea defaultValue={JSON.stringify(section.members, null, 2)} onBlur={(e) => handleJsonField('team','members',e.target.value)} rows={10} dir="ltr" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-200 font-mono focus:border-indigo-500 focus:outline-none" />
                      </div>
                    </>
                  )}

                  {sectionKey === 'contact' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['infoTitleFa','infoTitleEn','consultationTitleFa','consultationTitleEn','consultationTextFa','consultationTextEn','formTitleFa','formTitleEn','formSubtitleFa','formSubtitleEn'].map((field) => (
                        <div key={field} className={field.includes('Text') || field.includes('Subtitle') ? 'sm:col-span-2' : ''}>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">{field}</label>
                          <textarea value={section[field] || ''} onChange={(e) => handleSectionChange('contact',field,e.target.value)} rows={field.includes('Text') || field.includes('Subtitle') ? 2 : 1} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                      ))}
                    </div>
                  )}

                  {sectionKey === 'catalog' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={section.authenticityLabelFa || ''} onChange={(e) => handleSectionChange('catalog','authenticityLabelFa',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Authenticity label Fa" />
                      <input value={section.authenticityLabelEn || ''} onChange={(e) => handleSectionChange('catalog','authenticityLabelEn',e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Authenticity label En" />
                    </div>
                  )}
                </div>
              );
            })}
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
                value={content.footer.descriptionFa}
                onChange={(e) => handleFooterChange('descriptionFa', e.target.value)}
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
                value={content.footer.disclaimerFa}
                onChange={(e) => handleFooterChange('disclaimerFa', e.target.value)}
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{isFa ? 'ذخیره تغییرات محتوای متنی' : 'Save Page Content'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
