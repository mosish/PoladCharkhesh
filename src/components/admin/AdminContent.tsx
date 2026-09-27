import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import {
  CmsContent,
  CmsIndustryItem,
  CmsLocalizedCard,
  CmsTeamMember,
} from '../../types/admin';
import { dataService } from '../../services/dataService';
import {
  FileText,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface AdminContentProps {
  language: Language;
}

type ContentTab =
  | 'visibility'
  | 'hero'
  | 'about'
  | 'catalog'
  | 'tools'
  | 'whyUs'
  | 'industries'
  | 'team'
  | 'contact'
  | 'footer';

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none';
const textareaClass =
  'w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed';

export const AdminContent: React.FC<AdminContentProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [content, setContent] = useState<CmsContent>(dataService.getContent());
  const [activeTab, setActiveTab] = useState<ContentTab>('visibility');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => dataService.subscribeToContent(setContent), []);

  const updateSection = <K extends keyof CmsContent>(section: K, patch: Partial<CmsContent[K]>) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...(patch as object) },
    }));
  };

  const updateCard = (
    section: 'whyUs',
    index: number,
    patch: Partial<CmsLocalizedCard>
  ) => {
    setContent((prev) => {
      const cards = [...prev[section].cards];
      cards[index] = { ...cards[index], ...patch };
      return { ...prev, [section]: { ...prev[section], cards } };
    });
  };

  const updateIndustry = (index: number, patch: Partial<CmsIndustryItem>) => {
    setContent((prev) => {
      const items = [...prev.industries.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, industries: { ...prev.industries, items } };
    });
  };

  const updateTeam = (index: number, patch: Partial<CmsTeamMember>) => {
    setContent((prev) => {
      const members = [...prev.team.members];
      members[index] = { ...members[index], ...patch };
      return { ...prev, team: { ...prev.team, members } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSavedSuccess(false);
    setIsSaving(true);
    try {
      const result = await dataService.updateContent(content, 'admin');
      if (!result.success) {
        setSaveError(isFa ? 'ذخیره محتوای سایت ناموفق بود.' : 'Failed to save site content.');
        return;
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaveError(isFa ? 'خطای ارتباط با سرور هنگام ذخیره محتوا.' : 'Server communication error while saving content.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: ContentTab; fa: string; en: string }> = [
    { id: 'visibility', fa: 'نمایش سکشن‌ها', en: 'Visibility' },
    { id: 'hero', fa: 'هیرو', en: 'Hero' },
    { id: 'about', fa: 'درباره ما', en: 'About' },
    { id: 'catalog', fa: 'کاتالوگ', en: 'Catalog' },
    { id: 'tools', fa: 'ابزار مهندسی', en: 'Tools' },
    { id: 'whyUs', fa: 'چرا ما', en: 'Why Us' },
    { id: 'industries', fa: 'صنایع', en: 'Industries' },
    { id: 'team', fa: 'تیم', en: 'Team' },
    { id: 'contact', fa: 'تماس', en: 'Contact' },
    { id: 'footer', fa: 'فوتر', en: 'Footer' },
  ];

  const BilingualInput = ({
    label,
    valueFa,
    valueEn,
    onFa,
    onEn,
    multiline = false,
  }: {
    label: string;
    valueFa: string;
    valueEn: string;
    onFa: (v: string) => void;
    onEn: (v: string) => void;
    multiline?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {multiline ? (
          <>
            <textarea value={valueFa} onChange={(e) => onFa(e.target.value)} rows={3} className={textareaClass} dir="rtl" />
            <textarea value={valueEn} onChange={(e) => onEn(e.target.value)} rows={3} className={textareaClass} dir="ltr" />
          </>
        ) : (
          <>
            <input value={valueFa} onChange={(e) => onFa(e.target.value)} className={inputClass} dir="rtl" />
            <input value={valueEn} onChange={(e) => onEn(e.target.value)} className={inputClass} dir="ltr" />
          </>
        )}
      </div>
    </div>
  );

  const SectionHeaderEditor = ({
    section,
  }: {
    section: 'catalog' | 'tools' | 'whyUs' | 'industries' | 'team' | 'contact';
  }) => {
    const value = content[section];
    return (
      <div className="space-y-4">
        <BilingualInput
          label={isFa ? 'برچسب بالای عنوان' : 'Eyebrow / Tag'}
          valueFa={value.tagFa}
          valueEn={value.tagEn}
          onFa={(v) => updateSection(section, { tagFa: v } as any)}
          onEn={(v) => updateSection(section, { tagEn: v } as any)}
        />
        <BilingualInput
          label={isFa ? 'عنوان سکشن' : 'Section Title'}
          valueFa={value.titleFa}
          valueEn={value.titleEn}
          onFa={(v) => updateSection(section, { titleFa: v } as any)}
          onEn={(v) => updateSection(section, { titleEn: v } as any)}
        />
        <BilingualInput
          label={isFa ? 'زیرعنوان' : 'Subtitle'}
          valueFa={value.subtitleFa || ''}
          valueEn={value.subtitleEn || ''}
          onFa={(v) => updateSection(section, { subtitleFa: v } as any)}
          onEn={(v) => updateSection(section, { subtitleEn: v } as any)}
          multiline
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="admin-card p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'مدیریت کامل محتوای سایت' : 'Full-Site Content Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa
              ? 'تمام سکشن‌های عمومی سایت از همین صفحه و SQLite مدیریت می‌شوند.'
              : 'All public website sections are managed here and stored in SQLite.'}
          </p>
        </div>
        <div className="flex flex-col items-start xl:items-end gap-2">
          {savedSuccess && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              {isFa ? 'محتوا ذخیره شد.' : 'Content saved.'}
            </div>
          )}
          {saveError && (
            <div className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              {saveError}
            </div>
          )}
        </div>
      </div>

      <div className="admin-card p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isFa ? tab.fa : tab.en}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="admin-card p-5 sm:p-6 space-y-5">
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">{isFa ? 'کنترل نمایش سکشن‌ها' : 'Section Visibility'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(content.visibility).map(([key, enabled]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        visibility: { ...prev.visibility, [key]: !enabled },
                      }))
                    }
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-colors ${
                      enabled
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    <span className="capitalize">{key}</span>
                    {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-4">
              <BilingualInput label={isFa ? 'Badge' : 'Badge'} valueFa={content.hero.badgeFa} valueEn={content.hero.badgeEn}
                onFa={(v) => updateSection('hero', { badgeFa: v })} onEn={(v) => updateSection('hero', { badgeEn: v })} />
              <BilingualInput label={isFa ? 'عنوان برجسته' : 'Highlighted Title'} valueFa={content.hero.titleHighlightFa} valueEn={content.hero.titleHighlightEn}
                onFa={(v) => updateSection('hero', { titleHighlightFa: v })} onEn={(v) => updateSection('hero', { titleHighlightEn: v })} />
              <BilingualInput label={isFa ? 'عنوان اصلی' : 'Main Headline'} valueFa={content.hero.titleSuffixFa} valueEn={content.hero.titleSuffixEn}
                onFa={(v) => updateSection('hero', { titleSuffixFa: v })} onEn={(v) => updateSection('hero', { titleSuffixEn: v })} />
              <BilingualInput label={isFa ? 'توضیح' : 'Description'} valueFa={content.hero.descriptionFa} valueEn={content.hero.descriptionEn}
                onFa={(v) => updateSection('hero', { descriptionFa: v })} onEn={(v) => updateSection('hero', { descriptionEn: v })} multiline />
              <BilingualInput label={isFa ? 'متن جستجو' : 'Search Placeholder'} valueFa={content.hero.searchPlaceholderFa} valueEn={content.hero.searchPlaceholderEn}
                onFa={(v) => updateSection('hero', { searchPlaceholderFa: v })} onEn={(v) => updateSection('hero', { searchPlaceholderEn: v })} />
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <BilingualInput label={isFa ? 'برچسب' : 'Tag'} valueFa={content.about.tagFa} valueEn={content.about.tagEn}
                onFa={(v) => updateSection('about', { tagFa: v })} onEn={(v) => updateSection('about', { tagEn: v })} />
              <BilingualInput label={isFa ? 'عنوان' : 'Title'} valueFa={content.about.titleFa} valueEn={content.about.titleEn}
                onFa={(v) => updateSection('about', { titleFa: v })} onEn={(v) => updateSection('about', { titleEn: v })} />
              <BilingualInput label={isFa ? 'پاراگراف اول' : 'Paragraph 1'} valueFa={content.about.paragraph1Fa} valueEn={content.about.paragraph1En}
                onFa={(v) => updateSection('about', { paragraph1Fa: v })} onEn={(v) => updateSection('about', { paragraph1En: v })} multiline />
              <BilingualInput label={isFa ? 'پاراگراف دوم' : 'Paragraph 2'} valueFa={content.about.paragraph2Fa} valueEn={content.about.paragraph2En}
                onFa={(v) => updateSection('about', { paragraph2Fa: v })} onEn={(v) => updateSection('about', { paragraph2En: v })} multiline />
              <BilingualInput label={isFa ? 'عنوان مأموریت' : 'Mission Title'} valueFa={content.about.missionTitleFa} valueEn={content.about.missionTitleEn}
                onFa={(v) => updateSection('about', { missionTitleFa: v })} onEn={(v) => updateSection('about', { missionTitleEn: v })} />
              <BilingualInput label={isFa ? 'متن مأموریت' : 'Mission Text'} valueFa={content.about.missionTextFa} valueEn={content.about.missionTextEn}
                onFa={(v) => updateSection('about', { missionTextFa: v })} onEn={(v) => updateSection('about', { missionTextEn: v })} multiline />
              <BilingualInput label={isFa ? 'عنوان چشم‌انداز' : 'Vision Title'} valueFa={content.about.visionTitleFa} valueEn={content.about.visionTitleEn}
                onFa={(v) => updateSection('about', { visionTitleFa: v })} onEn={(v) => updateSection('about', { visionTitleEn: v })} />
              <BilingualInput label={isFa ? 'متن چشم‌انداز' : 'Vision Text'} valueFa={content.about.visionTextFa} valueEn={content.about.visionTextEn}
                onFa={(v) => updateSection('about', { visionTextFa: v })} onEn={(v) => updateSection('about', { visionTextEn: v })} multiline />
            </div>
          )}

          {(activeTab === 'catalog' || activeTab === 'tools') && <SectionHeaderEditor section={activeTab} />}

          {activeTab === 'whyUs' && (
            <div className="space-y-5">
              <SectionHeaderEditor section="whyUs" />
              <BilingualInput label={isFa ? 'متن تعهد' : 'Commitment Line'} valueFa={content.whyUs.commitmentFa} valueEn={content.whyUs.commitmentEn}
                onFa={(v) => updateSection('whyUs', { commitmentFa: v })} onEn={(v) => updateSection('whyUs', { commitmentEn: v })} />
              <div className="space-y-3">
                {content.whyUs.cards.map((card, index) => (
                  <div key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs"><GripVertical className="w-4 h-4" /> {card.id}</div>
                    <BilingualInput label={isFa ? 'عنوان کارت' : 'Card Title'} valueFa={card.titleFa} valueEn={card.titleEn}
                      onFa={(v) => updateCard('whyUs', index, { titleFa: v })} onEn={(v) => updateCard('whyUs', index, { titleEn: v })} />
                    <BilingualInput label={isFa ? 'توضیح کارت' : 'Card Description'} valueFa={card.descriptionFa} valueEn={card.descriptionEn}
                      onFa={(v) => updateCard('whyUs', index, { descriptionFa: v })} onEn={(v) => updateCard('whyUs', index, { descriptionEn: v })} multiline />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'industries' && (
            <div className="space-y-5">
              <SectionHeaderEditor section="industries" />
              <div className="space-y-3">
                {content.industries.items.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">{item.id}</span>
                      <button type="button" onClick={() => setContent((prev) => ({ ...prev, industries: { ...prev.industries, items: prev.industries.items.filter((_, i) => i !== index) } }))} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <BilingualInput label={isFa ? 'عنوان صنعت' : 'Industry Title'} valueFa={item.titleFa} valueEn={item.titleEn}
                      onFa={(v) => updateIndustry(index, { titleFa: v })} onEn={(v) => updateIndustry(index, { titleEn: v })} />
                    <BilingualInput label={isFa ? 'توضیح صنعت' : 'Industry Description'} valueFa={item.descriptionFa} valueEn={item.descriptionEn}
                      onFa={(v) => updateIndustry(index, { descriptionFa: v })} onEn={(v) => updateIndustry(index, { descriptionEn: v })} multiline />
                    <input
                      className={inputClass}
                      value={item.recommendedBearings.join(', ')}
                      onChange={(e) => updateIndustry(index, { recommendedBearings: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
                      placeholder="6204-2RS, 30208"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setContent((prev) => ({ ...prev, industries: { ...prev.industries, items: [...prev.industries.items, { id: `industry-${Date.now()}`, titleFa: '', titleEn: '', descriptionFa: '', descriptionEn: '', recommendedBearings: [], icon: 'Factory' }] } }))} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700">
                  <Plus className="w-4 h-4" /> {isFa ? 'افزودن صنعت' : 'Add Industry'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-5">
              <SectionHeaderEditor section="team" />
              <div className="space-y-3">
                {content.team.members.map((member, index) => (
                  <div key={member.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">{member.id}</span>
                      <button type="button" onClick={() => setContent((prev) => ({ ...prev, team: { ...prev.team, members: prev.team.members.filter((_, i) => i !== index) } }))} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <BilingualInput label={isFa ? 'نام' : 'Name'} valueFa={member.nameFa} valueEn={member.nameEn}
                      onFa={(v) => updateTeam(index, { nameFa: v })} onEn={(v) => updateTeam(index, { nameEn: v })} />
                    <BilingualInput label={isFa ? 'سمت' : 'Role'} valueFa={member.roleFa} valueEn={member.roleEn}
                      onFa={(v) => updateTeam(index, { roleFa: v })} onEn={(v) => updateTeam(index, { roleEn: v })} />
                    <BilingualInput label={isFa ? 'تجربه' : 'Experience'} valueFa={member.experienceFa} valueEn={member.experienceEn}
                      onFa={(v) => updateTeam(index, { experienceFa: v })} onEn={(v) => updateTeam(index, { experienceEn: v })} multiline />
                    <BilingualInput label={isFa ? 'تخصص' : 'Specialty'} valueFa={member.specialtyFa} valueEn={member.specialtyEn}
                      onFa={(v) => updateTeam(index, { specialtyFa: v })} onEn={(v) => updateTeam(index, { specialtyEn: v })} multiline />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input className={inputClass} value={member.phone || ''} onChange={(e) => updateTeam(index, { phone: e.target.value })} placeholder="Phone" />
                      <input className={inputClass} value={member.email || ''} onChange={(e) => updateTeam(index, { email: e.target.value })} placeholder="Email" />
                      <input className={inputClass} value={member.image} onChange={(e) => updateTeam(index, { image: e.target.value })} placeholder="Image URL" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setContent((prev) => ({ ...prev, team: { ...prev.team, members: [...prev.team.members, { id: `member-${Date.now()}`, nameFa: '', nameEn: '', roleFa: '', roleEn: '', experienceFa: '', experienceEn: '', specialtyFa: '', specialtyEn: '', image: '/icon.png' }] } }))} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700">
                  <Plus className="w-4 h-4" /> {isFa ? 'افزودن عضو تیم' : 'Add Team Member'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <SectionHeaderEditor section="contact" />
              <BilingualInput label={isFa ? 'عنوان اطلاعات تماس' : 'Contact Info Title'} valueFa={content.contact.infoTitleFa} valueEn={content.contact.infoTitleEn}
                onFa={(v) => updateSection('contact', { infoTitleFa: v })} onEn={(v) => updateSection('contact', { infoTitleEn: v })} />
              <BilingualInput label={isFa ? 'عنوان مشاوره' : 'Consultation Title'} valueFa={content.contact.consultationTitleFa} valueEn={content.contact.consultationTitleEn}
                onFa={(v) => updateSection('contact', { consultationTitleFa: v })} onEn={(v) => updateSection('contact', { consultationTitleEn: v })} />
              <BilingualInput label={isFa ? 'متن مشاوره' : 'Consultation Text'} valueFa={content.contact.consultationTextFa} valueEn={content.contact.consultationTextEn}
                onFa={(v) => updateSection('contact', { consultationTextFa: v })} onEn={(v) => updateSection('contact', { consultationTextEn: v })} multiline />
              <BilingualInput label={isFa ? 'عنوان فرم' : 'Form Title'} valueFa={content.contact.formTitleFa} valueEn={content.contact.formTitleEn}
                onFa={(v) => updateSection('contact', { formTitleFa: v })} onEn={(v) => updateSection('contact', { formTitleEn: v })} />
              <BilingualInput label={isFa ? 'توضیح فرم' : 'Form Subtitle'} valueFa={content.contact.formSubtitleFa} valueEn={content.contact.formSubtitleEn}
                onFa={(v) => updateSection('contact', { formSubtitleFa: v })} onEn={(v) => updateSection('contact', { formSubtitleEn: v })} multiline />
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-4">
              <BilingualInput label={isFa ? 'معرفی کوتاه' : 'Footer Summary'} valueFa={content.footer.descriptionFa} valueEn={content.footer.descriptionEn}
                onFa={(v) => updateSection('footer', { descriptionFa: v })} onEn={(v) => updateSection('footer', { descriptionEn: v })} multiline />
              <BilingualInput label={isFa ? 'کپی‌رایت' : 'Copyright'} valueFa={content.footer.copyrightFa} valueEn={content.footer.copyrightEn}
                onFa={(v) => updateSection('footer', { copyrightFa: v })} onEn={(v) => updateSection('footer', { copyrightEn: v })} />
              <BilingualInput label={isFa ? 'سلب مسئولیت فنی' : 'Technical Disclaimer'} valueFa={content.footer.disclaimerFa} valueEn={content.footer.disclaimerEn}
                onFa={(v) => updateSection('footer', { disclaimerFa: v })} onEn={(v) => updateSection('footer', { disclaimerEn: v })} multiline />
            </div>
          )}
        </div>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold shadow-2xl shadow-indigo-950/50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? (isFa ? 'در حال ذخیره...' : 'Saving...') : (isFa ? 'ذخیره کل محتوای سایت' : 'Save Full Site Content')}
          </button>
        </div>
      </form>
    </div>
  );
};
