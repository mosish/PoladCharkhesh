import React, { useEffect, useState } from 'react';
import type { Language } from '../../types';
import type { AdminProductItem, MediaMetadata } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { mediaService, ProductGallery } from '../../services/mediaService';
import { useUnsavedChanges } from './useUnsavedChanges';

export const AdminMedia: React.FC<{ language: Language }> = ({ language }) => {
  const fa = language === 'fa';
  const [items, setItems] = useState<MediaMetadata[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [selected, setSelected] = useState<MediaMetadata | null>(null);
  const [draft, setDraft] = useState({ originalName: '', altTextFa: '', altTextEn: '', category: 'product_photo' });
  const [savedDraft, setSavedDraft] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [type, setType] = useState('all');
  const [productId, setProductId] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [gallery, setGallery] = useState<ProductGallery | null>(null);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [mime, setMime] = useState('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = !!selected && JSON.stringify(draft) !== savedDraft;
  useUnsavedChanges(dirty);
  const choose = (item: MediaMetadata, force = false) => {
    if (!force && dirty && !window.confirm(fa ? 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟' : 'Discard unsaved metadata?')) return;
    const next = { originalName: item.originalName, altTextFa: item.altTextFa ?? '', altTextEn: item.altTextEn ?? '', category: item.category ?? 'product_photo' };
    setSelected(item); setDraft(next); setSavedDraft(JSON.stringify(next));
  };
  const reload = async () => {
    const result = await mediaService.getLibrary();
    if (!result.success) throw new Error(result.error.message);
    setItems(result.data.media);
  };
  const perform = async (work: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await work(); setNotice(fa ? 'عملیات با موفقیت انجام شد.' : 'Changes saved successfully.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => { void reload().catch(e => setError(e.message)); return dataService.subscribeToAllProducts(setProducts); }, []);
  useEffect(() => {
    let active = true; setGallery(null);
    if (productId) void mediaService.gallery(productId).then(result => {
      if (!active) return;
      if (result.success) setGallery(result.data.gallery); else setError(result.error.message);
    });
    return () => { active = false; };
  }, [productId]);
  const change = async (action: string, mediaId?: string, toIndex?: number) => {
    if (!gallery) return;
    await perform(async () => {
      const result = await mediaService.changeGallery(productId, { action, mediaId, toIndex, version: gallery.version });
      if (!result.success) throw new Error(result.error.message);
      setGallery(result.data.gallery); await reload(); await dataService.refreshFromServer(); await mediaService.refresh();
    });
  };
  const filtered = items.filter(item =>
    (type === 'all' || (type === 'pdf' ? item.mimeType === 'application/pdf' : item.mimeType.startsWith('image/'))) &&
    (filter === 'archived' ? item.isArchived : !item.isArchived) &&
    (filter !== 'unused' || !item.associatedProductCodes?.length) &&
    (filter !== 'missing' || (item.mimeType.startsWith('image/') && (!item.altTextFa?.trim() || !item.altTextEn?.trim()))) &&
    [item.originalName, item.url, item.altTextFa, item.altTextEn, ...(item.associatedProductCodes ?? [])].join(' ').toLowerCase().includes(query.toLowerCase())
  );
  return <div className="admin-editor">
    <header className="editor-heading"><div><p className="editor-eyebrow">{fa ? 'فایل‌ها و گالری محصولات' : 'ASSETS & PRODUCT GALLERIES'}</p>
      <h2>{fa ? 'کتابخانه رسانه' : 'Media library'}</h2>
      <p>{fa ? 'تصویر و PDF را بارگذاری یا با آدرس ثبت کنید. حذف از گالری و بایگانی، فایل را پاک نمی‌کند.' : 'Upload or register images and PDFs. Detaching and archiving retain the original file.'}</p></div>
      <span>{items.length} {fa ? 'رسانه' : 'assets'}</span>
    </header>
    <div aria-live="polite">{error && <p role="alert" className="editor-error">{error}</p>}{notice && <p role="status" className="editor-success">{notice}</p>}{busy && <p role="status">{fa ? 'در حال انجام…' : 'Working…'}</p>}</div>
    <fieldset disabled={busy} className="editor-group"><legend>{fa ? 'افزودن رسانه' : 'Add media'}</legend>
      <label className="editor-field"><span>{fa ? 'بارگذاری JPEG، PNG، WebP یا PDF — حداکثر ۱۰ مگابایت' : 'Upload JPEG, PNG, WebP or PDF — up to 10 MB'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => {
          const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
          if (dirty && !window.confirm(fa ? 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟' : 'Discard unsaved metadata?')) return;
          if (file.size > 10 * 1024 * 1024) { setError(fa ? 'حداکثر اندازه فایل ۱۰ مگابایت است.' : 'Maximum file size is 10 MB.'); return; }
          void perform(async () => { const result = await mediaService.upload(file); if (!result.success) throw new Error(result.error.message); await reload(); choose(result.data.media, true); });
        }} /></label>
      <details><summary>{fa ? 'ثبت فایل با آدرس' : 'Register an existing asset URL'}</summary>
        <form className="editor-fields mt-4" onSubmit={e => { e.preventDefault();
          if (dirty && !window.confirm(fa ? 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟' : 'Discard unsaved metadata?')) return;
          void perform(async () => {
            const result = await mediaService.register({ originalName: name, url, mimeType: mime, sizeBytes: 0 });
            if (!result.success) throw new Error(result.error.message); await reload(); choose(result.data.media, true); setUrl(''); setName('');
          });
        }}><label className="editor-field"><span>{fa ? 'نام فایل' : 'Filename'}</span><input required maxLength={255} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="editor-field"><span>{fa ? 'آدرس محلی یا HTTPS' : 'Local path or HTTPS URL'}</span><input required dir="ltr" value={url} onChange={e => setUrl(e.target.value)} /></label>
          <label className="editor-field"><span>{fa ? 'نوع فایل' : 'File type'}</span><select value={mime} onChange={e => setMime(e.target.value)}>{['image/jpeg','image/png','image/webp','application/pdf'].map(v => <option key={v}>{v}</option>)}</select></label>
          <button className="editor-primary" type="submit">{fa ? 'ثبت رسانه' : 'Register asset'}</button>
        </form></details>
    </fieldset>
    <div className="editor-toolbar">
      <input aria-label={fa ? 'جستجوی رسانه' : 'Search media'} placeholder={fa ? 'نام، متن جایگزین یا کد محصول…' : 'Name, alt text or product code…'} value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label={fa ? 'نوع رسانه' : 'Media type'} value={type} onChange={e => setType(e.target.value)}><option value="all">{fa ? 'همه انواع' : 'All types'}</option><option value="image">{fa ? 'تصاویر' : 'Images'}</option><option value="pdf">PDF</option></select>
      <select aria-label={fa ? 'وضعیت رسانه' : 'Media status'} value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="active">{fa ? 'فعال' : 'Active'}</option><option value="archived">{fa ? 'بایگانی' : 'Archived'}</option>
        <option value="unused">{fa ? 'بدون محصول مرتبط' : 'No product association'}</option><option value="missing">{fa ? 'متن جایگزین ناقص' : 'Missing alt text'}</option>
      </select><button disabled={busy} onClick={() => void perform(reload)}>{fa ? 'بازخوانی فهرست' : 'Refresh list'}</button>
    </div>
    <div className="media-layout"><div><p className="mb-3 text-sm text-slate-400">{filtered.length} {fa ? 'نتیجه' : 'results'}</p>
      <div className="media-grid">{filtered.map(item => <button disabled={busy} type="button" key={item.id} aria-pressed={selected?.id === item.id} className="media-tile" onClick={() => choose(item)}>
        {item.mimeType.startsWith('image/') ? <img loading="lazy" src={item.url} alt={(fa ? item.altTextFa : item.altTextEn) || item.originalName} /> : <span className="media-pdf">PDF</span>}
        <strong>{item.originalName}</strong><small>{item.associatedProductCodes?.length ?? 0} {fa ? 'محصول' : 'products'}</small>
      </button>)}</div>{!filtered.length && <p className="editor-empty">{fa ? 'رسانه‌ای با این فیلتر پیدا نشد.' : 'No assets match these filters.'}</p>}</div>
      <aside className="editor-group">{selected ? <><h3 className="font-bold text-lg mb-4">{fa ? 'جزئیات رسانه' : 'Asset details'}</h3>
        <a href={selected.url} target="_blank" rel="noopener noreferrer" className="break-all">{fa ? 'مشاهده فایل' : 'Open original'} ↗</a>
        <p className="text-sm text-slate-400 my-3">{selected.mimeType} · {selected.sizeBytes ? Math.round(selected.sizeBytes / 1024) + ' KB' : (fa ? 'اندازه نامشخص' : 'Size unknown')}</p>
        <form onSubmit={e => { e.preventDefault(); void perform(async () => {
          const result = await mediaService.update(selected.id, { ...draft, revision: selected.revision });
          if (!result.success) throw new Error(result.error.message); choose(result.data.media, true); await reload(); await mediaService.refresh();
        }); }}><fieldset disabled={busy} className="space-y-4">
          <label className="editor-field"><span>{fa ? 'نام فایل' : 'Filename'}</span><input required maxLength={255} value={draft.originalName} onChange={e => setDraft({ ...draft, originalName: e.target.value })} /></label>
          <label className="editor-field"><span>متن جایگزین فارسی</span><textarea aria-label="متن جایگزین فارسی" dir="rtl" maxLength={1000} value={draft.altTextFa} onChange={e => setDraft({ ...draft, altTextFa: e.target.value })} /></label>
          <label className="editor-field"><span>English alt text</span><textarea aria-label="English alt text" dir="ltr" maxLength={1000} value={draft.altTextEn} onChange={e => setDraft({ ...draft, altTextEn: e.target.value })} /></label>
          <label className="editor-field"><span>{fa ? 'دسته' : 'Category'}</span><select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
            {[['product_photo','تصویر محصول','Product photo'],['cad_schematic','نقشه فنی','Schematic'],['datasheet_pdf','برگه PDF','PDF datasheet'],['company_photo','تصویر شرکت','Company photo']].map(([v,a,b]) => <option key={v} value={v}>{fa ? a : b}</option>)}
          </select></label><button disabled={!dirty} className="editor-primary" type="submit">{fa ? 'ذخیره مشخصات' : 'Save metadata'}</button>
        </fieldset></form>
        <p className="text-sm my-4">{fa ? 'محصولات مرتبط: ' : 'Used by products: '}{items.find(item => item.id === selected.id)?.associatedProductCodes?.join('، ') || '—'}</p>
        <button disabled={busy || dirty} type="button" onClick={() => void perform(async () => {
          const result = await mediaService.archive(selected.id, !selected.isArchived);
          if (!result.success) throw new Error(result.error.message); choose(result.data.media, true); await reload();
        })}>{selected.isArchived ? (fa ? 'بازگردانی از بایگانی' : 'Restore asset') : (fa ? 'بایگانی رسانه' : 'Archive asset')}</button>
      </> : <p className="editor-empty">{fa ? 'یک رسانه را برای ویرایش انتخاب کنید.' : 'Select an asset to edit its metadata.'}</p>}</aside>
    </div>
    <section className="editor-group"><h3 className="font-bold text-xl mb-3">{fa ? 'گالری و PDF محصول' : 'Product gallery & PDF'}</h3>
      <div className="editor-toolbar"><input aria-label={fa ? 'جستجوی محصول' : 'Search products'} placeholder={fa ? 'جستجوی محصول…' : 'Search products…'} value={productQuery} onChange={e => setProductQuery(e.target.value)} />
        <select disabled={busy} aria-label={fa ? 'انتخاب محصول' : 'Select product'} value={productId} onChange={e => setProductId(e.target.value)}>
          <option value="">{fa ? 'انتخاب محصول' : 'Choose a product'}</option>
          {products.filter(p => p.id === productId || [p.code,p.nameFa,p.nameEn].join(' ').toLowerCase().includes(productQuery.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.code} — {fa ? p.nameFa : p.nameEn}{p.isArchived ? (fa ? ' (بایگانی)' : ' (archived)') : ''}</option>)}
        </select><button disabled={busy || !productId} onClick={() => void perform(async () => { const result = await mediaService.gallery(productId); if (!result.success) throw new Error(result.error.message); setGallery(result.data.gallery); })}>{fa ? 'بازخوانی گالری' : 'Reload gallery'}</button></div>
      {gallery && <><div className="editor-toolbar">
        <button className="editor-primary" disabled={busy || !selected || selected.isArchived} onClick={() => {
          if (selected?.mimeType === 'application/pdf' && gallery.pdfUrl && gallery.pdfUrl !== selected.url &&
            !window.confirm(fa ? 'PDF مرتبط جایگزین شود؟ فایل قبلی در کتابخانه باقی می‌ماند.' : 'Replace the linked PDF? The previous file stays in the library.')) return;
          void change(selected?.mimeType === 'application/pdf' ? 'setPdf' : 'attach', selected?.id);
        }}>{fa ? 'اتصال رسانه انتخاب‌شده به محصول' : 'Attach selected asset to product'}</button>
        <small>{fa ? 'تصویر اول، تصویر اصلی محصول است.' : 'The first image is the primary product image.'}</small>
      </div><div className="media-grid">{gallery.images.map((image, index) => {
        const item = items.find(asset => asset.url === image);
        return <div className="media-tile" key={image}><img src={image} alt={(fa ? item?.altTextFa : item?.altTextEn) || ''} />
          <span>{index + 1}{index === 0 ? (fa ? ' · اصلی' : ' · Primary') : ''}</span>
          <div className="editor-actions">
            <button disabled={busy || index === 0 || !item} aria-label={fa ? 'انتقال به بالا' : 'Move earlier'} onClick={() => void change('move', item?.id, index - 1)}>↑</button>
            <button disabled={busy || index === gallery.images.length - 1 || !item} aria-label={fa ? 'انتقال به پایین' : 'Move later'} onClick={() => void change('move', item?.id, index + 1)}>↓</button>
            <button disabled={busy || index === 0 || !item} onClick={() => void change('primary', item?.id)}>{fa ? 'اصلی' : 'Primary'}</button>
            <button disabled={busy || !item} onClick={() => { if (window.confirm(fa ? 'این تصویر از گالری جدا شود؟ فایل باقی می‌ماند.' : 'Detach this image? The file remains available.')) void change('detach', item?.id); }}>{fa ? 'جدا کردن' : 'Detach'}</button>
          </div></div>;
      })}</div>
      {gallery.pdfUrl && <div className="editor-toolbar"><a href={gallery.pdfUrl} target="_blank" rel="noreferrer">PDF ↗</a><button disabled={busy} onClick={() => { if (window.confirm(fa ? 'PDF از محصول جدا شود؟' : 'Detach the product PDF?')) void change('clearPdf'); }}>{fa ? 'جدا کردن PDF' : 'Detach PDF'}</button></div>}
      {!gallery.images.length && <p className="editor-empty">{fa ? 'هنوز تصویری متصل نیست.' : 'No images attached yet.'}</p>}</>}
    </section>
  </div>;
};
