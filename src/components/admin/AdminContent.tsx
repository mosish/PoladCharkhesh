import React, { useEffect, useState } from 'react';
import type { Language } from '../../types';
import type { CmsPageContent } from '../../types/admin';
import { DEFAULT_PAGE_CONTENT } from '../../data/contentDefaults';
import { apiClient } from '../../services/apiClient';
import { dataService } from '../../services/dataService';
import { useUnsavedChanges } from './useUnsavedChanges';

const names: Record<string, [string, string]> = {
  main: ['متن اصلی', 'Main content'], details: ['جزئیات', 'Details'],
  fa: ['فارسی', 'Persian'], en: ['English', 'English'], title: ['عنوان', 'Title'], tag: ['برچسب', 'Tag'],
  badge: ['نشان', 'Badge'], subtitle: ['توضیح کوتاه', 'Subtitle'], desc: ['توضیحات', 'Description'],
  cards: ['کارت‌ها', 'Cards'], stats: ['آمار', 'Statistics'], features: ['مزایا', 'Features'],
  nameFa: ['نام فارسی', 'Name · Persian'], nameEn: ['نام انگلیسی', 'Name · English'],
  roleFa: ['سمت فارسی', 'Role · Persian'], roleEn: ['سمت انگلیسی', 'Role · English'],
  experienceFa: ['تجربه فارسی', 'Experience · Persian'], experienceEn: ['تجربه انگلیسی', 'Experience · English'],
  specialtyFa: ['تخصص فارسی', 'Specialty · Persian'], specialtyEn: ['تخصص انگلیسی', 'Specialty · English'],
  titleFa: ['عنوان فارسی', 'Title · Persian'], titleEn: ['عنوان انگلیسی', 'Title · English'],
  descriptionFa: ['توضیحات فارسی', 'Description · Persian'], descriptionEn: ['توضیحات انگلیسی', 'Description · English'],
  image: ['آدرس تصویر', 'Image URL'], phone: ['تلفن', 'Phone'], email: ['ایمیل', 'Email'],
  recommendedBearings: ['کدهای مرتبط', 'Related product codes'], icon: ['نماد', 'Icon'],
  popularCodes: ['کدهای پرکاربرد', 'Popular product codes'], name: ['نام', 'Name'],
  originFa: ['مبدأ فارسی', 'Origin · Persian'], originEn: ['مبدأ انگلیسی', 'Origin · English'],
  hero: ['صفحه اصلی', 'Hero'], about: ['درباره ما', 'About'], footer: ['پاورقی', 'Footer'],
  catalog: ['معرفی کاتالوگ', 'Catalog introduction'], tools: ['معرفی ابزار مهندسی', 'Engineering introduction'],
  whyUs: ['مزایای همکاری', 'Why choose us'], industries: ['معرفی صنایع', 'Industries introduction'],
  team: ['معرفی تیم', 'Team introduction'], contact: ['متن تماس و فرم', 'Contact & inquiry copy'],
  nav: ['منوی سایت', 'Navigation'], teamMembers: ['اعضای تیم', 'Team members'],
  industryApplications: ['کارت‌های صنایع', 'Industry cards'], brands: ['برندها', 'Brands'],
};
const title = (key: string, fa: boolean) => names[key]?.[fa ? 0 : 1] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2');
function blank(value: any): any {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' ? crypto.randomUUID() : blank(v)]));
  return '';
}
function coverage(value: any, key = ''): { total: number; missing: number } {
  if (typeof value === 'string') return /(?:Fa|En|fa|en)$/.test(key) ? { total: 1, missing: value.trim() ? 0 : 1 } : { total: 0, missing: 0 };
  return Object.entries(value ?? {}).reduce((sum, [k, v]) => {
    const next = coverage(v, k);
    return { total: sum.total + next.total, missing: sum.missing + next.missing };
  }, { total: 0, missing: 0 });
}
function Fields({ value, template, onChange, label, fa }: { value: any; template: any; onChange: (v: any) => void; label: string; fa: boolean }) {
  if (typeof value === 'string') {
    const english = /(?:En|en)$/.test(label);
    return <label className="editor-field"><span>{title(label, fa)}</span>
      <textarea aria-label={title(label, fa)} dir={english ? 'ltr' : /(?:Fa|fa)$/.test(label) ? 'rtl' : 'auto'} lang={english ? 'en' : undefined}
        value={value} maxLength={5000} rows={value.length > 120 ? 4 : 2} onChange={e => onChange(e.target.value)} />
    </label>;
  }
  if (Array.isArray(value)) return <fieldset className="editor-group"><legend>{title(label, fa)} ({value.length})</legend>
    {value.map((item, i) => <div className="editor-item" key={item.id ?? i}>
      <div className="editor-actions"><span>{i + 1}</span>
        <button type="button" disabled={i === 0} aria-label={fa ? 'انتقال به بالا' : 'Move up'} onClick={() => { const next = [...value]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange(next); }}>↑</button>
        <button type="button" disabled={i === value.length - 1} aria-label={fa ? 'انتقال به پایین' : 'Move down'} onClick={() => { const next = [...value]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; onChange(next); }}>↓</button>
        <button type="button" onClick={() => onChange(value.filter((_, index) => index !== i))}>{fa ? 'حذف از پیش‌نویس' : 'Remove from draft'}</button>
      </div>
      <Fields value={item} template={template[0]} label={label} fa={fa} onChange={next => onChange(value.map((v, index) => index === i ? next : v))} />
    </div>)}
    <button type="button" disabled={value.length >= 50} onClick={() => onChange([...value, blank(template[0])])}>{fa ? 'افزودن مورد' : 'Add item'}</button>
  </fieldset>;
  return <fieldset className="editor-group"><legend>{title(label, fa)}</legend><div className="editor-fields">{Object.entries(value ?? {}).filter(([key]) => key !== 'id').map(([key, item]) =>
    <Fields key={key} label={key} value={item} template={template?.[key]} fa={fa} onChange={next => onChange({ ...value, [key]: next })} />)}</div></fieldset>;
}

export const AdminContent: React.FC<{ language: Language }> = ({ language }) => {
  const fa = language === 'fa';
  const [content, setContent] = useState<CmsPageContent | null>(null);
  const [saved, setSaved] = useState('');
  const [section, setSection] = useState('hero');
  const [query, setQuery] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = !!content && JSON.stringify(content) !== saved;
  useUnsavedChanges(dirty);
  const reload = async () => {
    setBusy(true); setError('');
    try {
      const result = await apiClient.get<{ content: CmsPageContent }>('/api/content');
      if (!result.success) throw new Error(result.error.message);
      setContent(result.data.content); setSaved(JSON.stringify(result.data.content));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  useEffect(() => { void reload(); }, []);
  const sections = ['hero', 'about', 'footer', ...Object.keys(DEFAULT_PAGE_CONTENT.copy).filter(k => !['hero', 'about', 'footer'].includes(k))];
  const getSection = (key: string, source: CmsPageContent) => ['hero', 'about', 'footer'].includes(key)
    ? { main: (source as any)[key], details: (source.copy as any)[key] }
    : (source.copy as any)[key];
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!content) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiClient.put<{ content: CmsPageContent }>('/api/content', content);
      if (!result.success) throw new Error(result.error.message);
      setContent(result.data.content); setSaved(JSON.stringify(result.data.content));
      setNotice(fa ? 'ذخیره شد و در سایت نمایش داده می‌شود.' : 'Saved and published to the website.');
      await dataService.refreshFromServer();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <div className="admin-editor">
    <header className="editor-heading"><div><p className="editor-eyebrow">{fa ? 'مدیریت سایت' : 'SITE OPERATIONS'}</p>
      <h2>{fa ? 'محتوای سایت' : 'Website content'}</h2>
      <p>{fa ? 'هر دو زبان را مستقل ویرایش کنید. متن خالی به همان صورت باقی می‌ماند.' : 'Edit both languages independently. Empty translations remain empty.'}</p></div>
      <a href="/" target="_blank" rel="noreferrer">{fa ? 'مشاهده سایت' : 'View website'} ↗</a>
    </header>
    <div className="editor-toolbar"><input aria-label={fa ? 'جستجوی بخش یا متن' : 'Search sections or text'} placeholder={fa ? 'جستجوی بخش یا متن…' : 'Search sections or text…'} value={query} onChange={e => setQuery(e.target.value)} />
      <label><input type="checkbox" checked={missingOnly} onChange={e => setMissingOnly(e.target.checked)} /> {fa ? 'ترجمه‌های ناقص' : 'Missing translations'}</label>
      <button disabled={busy} onClick={() => { if (!dirty || window.confirm(fa ? 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟' : 'Discard unsaved changes?')) void reload(); }}>{fa ? 'بازخوانی' : 'Reload'}</button>
    </div>
    {error && <p role="alert" className="editor-error">{error}</p>}
    {notice && <p role="status" className="editor-success">{notice}</p>}
    {!content ? <p role="status">{busy ? (fa ? 'در حال دریافت…' : 'Loading…') : (fa ? 'دریافت محتوا ناموفق بود؛ دوباره تلاش کنید.' : 'Content unavailable. Retry loading.')}</p> :
      <form onSubmit={save} className="editor-layout"><nav aria-label={fa ? 'بخش‌های محتوا' : 'Content sections'} className="editor-sections">
        {sections.filter(key => {
          const value = getSection(key, content); const stats = coverage(value);
          return (!missingOnly || stats.missing > 0) && (title(key, fa) + JSON.stringify(value)).toLowerCase().includes(query.toLowerCase());
        }).map(key => { const stats = coverage(getSection(key, content)); return <button type="button" key={key} aria-current={section === key ? 'true' : undefined} onClick={() => setSection(key)}>
          <span>{title(key, fa)}</span><small>{stats.total - stats.missing}/{stats.total} {fa ? 'ترجمه' : 'translations'}</small></button>; })}
      </nav><div className="min-w-0"><fieldset disabled={busy}>
        <h3 className="mb-5 font-bold text-lg">{title(section, fa)}</h3>
        <Fields label={section} fa={fa} value={getSection(section, content)} template={getSection(section, DEFAULT_PAGE_CONTENT)} onChange={value => {
          setNotice('');
          if (['hero', 'about', 'footer'].includes(section)) setContent({ ...content, [section]: value.main, copy: { ...content.copy, [section]: value.details } });
          else setContent({ ...content, copy: { ...content.copy, [section]: value } });
        }} />
      </fieldset><div className="editor-savebar"><span role="status">{dirty ? (fa ? 'تغییرات ذخیره نشده' : 'Unsaved changes') : (fa ? 'همگام با سرور' : 'Up to date')}</span>
        <button type="submit" className="editor-primary" disabled={busy || !dirty}>{busy ? (fa ? 'در حال ذخیره…' : 'Saving…') : (fa ? 'ذخیره محتوا' : 'Save content')}</button>
      </div></div></form>}
  </div>;
};
