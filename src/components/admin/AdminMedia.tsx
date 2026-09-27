import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { AdminProductItem, MediaCategory, MediaMetadata, MediaUploadInput } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { mediaService } from '../../services/mediaService';
import {
  Image as ImageIcon,
  Search,
  Plus,
  Save,
  Trash2,
  Edit,
  ExternalLink,
  FileText,
  Link2,
  Star,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface AdminMediaProps {
  language: Language;
}

const categories: Array<{ id: MediaCategory; fa: string; en: string }> = [
  { id: 'product_photo', fa: 'تصویر محصول', en: 'Product Photo' },
  { id: 'cad_schematic', fa: 'شماتیک / CAD', en: 'CAD / Schematic' },
  { id: 'datasheet_pdf', fa: 'دیتاشیت PDF', en: 'Datasheet PDF' },
  { id: 'company_photo', fa: 'تصویر شرکت', en: 'Company Photo' },
];

const emptyDraft: MediaUploadInput = {
  originalName: '',
  mimeType: 'image/webp',
  sizeBytes: 0,
  url: '',
  altTextFa: '',
  altTextEn: '',
  category: 'product_photo',
  associatedProductCodes: [],
};

const fieldClass =
  'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none';

export const AdminMedia: React.FC<AdminMediaProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MediaCategory>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaMetadata | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [draft, setDraft] = useState<MediaUploadInput>({ ...emptyDraft });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; message?: string }>({});

  const refresh = async () => {
    const result = await mediaService.getMediaList();
    if (result.success) setMedia(result.data.media);
  };

  useEffect(() => {
    refresh();
    const unsub = dataService.subscribeToAllProducts(setProducts);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return media.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return [
        item.originalName,
        item.filename,
        item.url,
        item.altTextFa,
        item.altTextEn,
        ...(item.associatedProductCodes || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [media, search, categoryFilter]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const startCreate = () => {
    setSelectedMedia(null);
    setDraft({ ...emptyDraft, associatedProductCodes: [] });
    setIsEditing(true);
    setStatus({});
  };

  const startEdit = (item: MediaMetadata) => {
    setSelectedMedia(item);
    setDraft({
      originalName: item.originalName,
      filename: item.filename,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      url: item.url,
      altTextFa: item.altTextFa || '',
      altTextEn: item.altTextEn || '',
      category: item.category || 'product_photo',
      associatedProductCodes: [...(item.associatedProductCodes || [])],
    });
    setIsEditing(true);
    setStatus({});
  };

  const saveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({});
    try {
      const payload: MediaUploadInput = {
        ...draft,
        originalName: draft.originalName.trim(),
        filename: draft.filename?.trim() || draft.originalName.trim(),
        mimeType: draft.mimeType.trim(),
        url: draft.url.trim(),
        altTextFa: draft.altTextFa?.trim(),
        altTextEn: draft.altTextEn?.trim(),
        associatedProductCodes: (draft.associatedProductCodes || []).map((v) => v.trim()).filter(Boolean),
      };

      const result = selectedMedia
        ? await mediaService.updateMedia(selectedMedia.id, payload)
        : await mediaService.createMedia(payload);

      if (!result.success) {
        setStatus({ ok: false, message: result.error.message });
        return;
      }

      await refresh();
      setSelectedMedia(result.data.media);
      setIsEditing(false);
      setStatus({ ok: true, message: isFa ? 'رسانه با موفقیت ذخیره شد.' : 'Media saved successfully.' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMedia = async (item: MediaMetadata) => {
    if (!window.confirm(isFa ? `رسانه «${item.originalName}» حذف شود؟` : `Delete “${item.originalName}”? `)) return;
    const result = await mediaService.deleteMedia(item.id);
    if (!result.success) {
      setStatus({ ok: false, message: result.error.message });
      return;
    }
    if (selectedMedia?.id === item.id) setSelectedMedia(null);
    await refresh();
    setStatus({ ok: true, message: isFa ? 'رسانه حذف شد.' : 'Media deleted.' });
  };

  const addToProductGallery = async (setPrimary: boolean) => {
    if (!selectedMedia || !selectedProduct) return;
    const existing = selectedProduct.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : [selectedProduct.imageUrl || '/icon.png'];
    const nextImages = [selectedMedia.url, ...existing.filter((url) => url !== selectedMedia.url)];
    const result = await dataService.updateProduct(
      selectedProduct.id,
      {
        images: nextImages,
        imageUrl: setPrimary ? selectedMedia.url : (selectedProduct.imageUrl || nextImages[0]),
        pdfUrl: selectedMedia.category === 'datasheet_pdf' ? selectedMedia.url : selectedProduct.pdfUrl,
      },
      'admin'
    );

    if (!result.success) {
      setStatus({ ok: false, message: result.errors?.join(' ') || (isFa ? 'اتصال رسانه به محصول ناموفق بود.' : 'Failed to attach media to product.') });
      return;
    }

    const codes = Array.from(new Set([...(selectedMedia.associatedProductCodes || []), selectedProduct.code]));
    await mediaService.updateMedia(selectedMedia.id, { associatedProductCodes: codes });
    await refresh();
    setStatus({ ok: true, message: isFa ? 'رسانه به محصول متصل شد.' : 'Media attached to product.' });
  };

  const removeFromProductGallery = async () => {
    if (!selectedMedia || !selectedProduct) return;
    const remaining = (selectedProduct.images || []).filter((url) => url !== selectedMedia.url);
    const nextPrimary = selectedProduct.imageUrl === selectedMedia.url
      ? (remaining[0] || '/icon.png')
      : selectedProduct.imageUrl;

    const result = await dataService.updateProduct(
      selectedProduct.id,
      {
        images: remaining,
        imageUrl: nextPrimary,
        pdfUrl: selectedProduct.pdfUrl === selectedMedia.url ? undefined : selectedProduct.pdfUrl,
      },
      'admin'
    );

    if (!result.success) {
      setStatus({ ok: false, message: result.errors?.join(' ') || 'Update failed' });
      return;
    }

    const codes = (selectedMedia.associatedProductCodes || []).filter((code) => code !== selectedProduct.code);
    await mediaService.updateMedia(selectedMedia.id, { associatedProductCodes: codes });
    await refresh();
    setStatus({ ok: true, message: isFa ? 'رسانه از محصول جدا شد.' : 'Media detached from product.' });
  };

  const isImage = (item: MediaMetadata) => item.mimeType.startsWith('image/') || item.category === 'product_photo' || item.category === 'cad_schematic';

  return (
    <div className="space-y-6">
      <div className="admin-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'کتابخانه پیشرفته رسانه' : 'Advanced Media Library'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa ? 'تصاویر، شماتیک‌ها و PDFها را ثبت، دسته‌بندی و به محصولات متصل کنید.' : 'Register, classify, edit, and attach images, schematics, and PDFs to products.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
            <Plus className="w-4 h-4" />
            {isFa ? 'رسانه جدید' : 'New Media'}
          </button>
        </div>
      </div>

      {status.message && (
        <div className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          status.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {status.ok && <CheckCircle2 className="w-4 h-4" />}
          {status.message}
        </div>
      )}

      <div className="admin-card p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={`${fieldClass} pl-9`} placeholder={isFa ? 'جستجو در نام، URL، alt text یا کد محصول...' : 'Search name, URL, alt text, or product code...'} />
        </div>
        <div className="md:col-span-4">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} className={fieldClass}>
            <option value="all">{isFa ? 'همه دسته‌ها' : 'All Categories'}</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{isFa ? cat.fa : cat.en}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 admin-card p-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">{isFa ? 'رسانه‌ای یافت نشد.' : 'No media found.'}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item) => (
                <div key={item.id} className={`rounded-2xl border overflow-hidden transition-all ${
                  selectedMedia?.id === item.id ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 bg-slate-950/60'
                }`}>
                  <button type="button" onClick={() => setSelectedMedia(item)} className="block w-full text-start">
                    <div className="aspect-[16/10] bg-slate-900 flex items-center justify-center overflow-hidden">
                      {isImage(item) ? (
                        <img src={item.url} alt={language === 'fa' ? item.altTextFa || item.originalName : item.altTextEn || item.originalName} className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-10 h-10 text-rose-400" />
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="font-bold text-white text-xs truncate">{item.originalName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{item.url}</div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.category && <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px]">{item.category}</span>}
                        {(item.associatedProductCodes || []).slice(0, 2).map((code) => <span key={code} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">{code}</span>)}
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pb-3 flex gap-2">
                    <button type="button" onClick={() => startEdit(item)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                    <a href={item.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
                    <button type="button" onClick={() => deleteMedia(item)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-5">
          {isEditing ? (
            <form onSubmit={saveMedia} className="admin-card p-5 space-y-4 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{selectedMedia ? (isFa ? 'ویرایش رسانه' : 'Edit Media') : (isFa ? 'ثبت رسانه جدید' : 'New Media')}</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <input className={fieldClass} value={draft.originalName} onChange={(e) => setDraft({ ...draft, originalName: e.target.value })} placeholder={isFa ? 'نام فایل / عنوان' : 'Original name / title'} required />
              <input className={fieldClass} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://... or /media/..." required />
              <div className="grid grid-cols-2 gap-2">
                <input className={fieldClass} value={draft.mimeType} onChange={(e) => setDraft({ ...draft, mimeType: e.target.value })} placeholder="image/webp" />
                <input className={fieldClass} type="number" min="0" value={draft.sizeBytes} onChange={(e) => setDraft({ ...draft, sizeBytes: Number(e.target.value) || 0 })} placeholder="Bytes" />
              </div>
              <select className={fieldClass} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as MediaCategory })}>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{isFa ? cat.fa : cat.en}</option>)}
              </select>
              <input className={fieldClass} value={draft.altTextFa || ''} onChange={(e) => setDraft({ ...draft, altTextFa: e.target.value })} placeholder="Alt text فارسی" dir="rtl" />
              <input className={fieldClass} value={draft.altTextEn || ''} onChange={(e) => setDraft({ ...draft, altTextEn: e.target.value })} placeholder="English alt text" dir="ltr" />
              <textarea className={fieldClass} rows={2} value={(draft.associatedProductCodes || []).join(', ')} onChange={(e) => setDraft({ ...draft, associatedProductCodes: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} placeholder={isFa ? 'کد محصولات مرتبط، با کاما جدا شود' : 'Associated product codes, comma separated'} />
              <button disabled={isSaving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold">
                <Save className="w-4 h-4" />
                {isSaving ? (isFa ? 'در حال ذخیره...' : 'Saving...') : (isFa ? 'ذخیره رسانه' : 'Save Media')}
              </button>
            </form>
          ) : selectedMedia ? (
            <div className="admin-card p-5 space-y-4 sticky top-24">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedMedia.originalName}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 break-all">{selectedMedia.url}</p>
              </div>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={fieldClass}>
                <option value="">{isFa ? 'یک محصول انتخاب کنید...' : 'Select a product...'}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {isFa ? p.nameFa : p.nameEn}</option>)}
              </select>
              {selectedProduct && (
                <div className="space-y-2">
                  <button type="button" onClick={() => addToProductGallery(false)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold">
                    <Link2 className="w-4 h-4" /> {isFa ? 'افزودن به گالری محصول' : 'Add to Product Gallery'}
                  </button>
                  <button type="button" onClick={() => addToProductGallery(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 text-xs font-bold">
                    <Star className="w-4 h-4" /> {isFa ? 'تنظیم به‌عنوان تصویر اصلی' : 'Set as Primary Image'}
                  </button>
                  <button type="button" onClick={removeFromProductGallery} className="w-full px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold">
                    {isFa ? 'حذف از گالری محصول' : 'Remove from Product Gallery'}
                  </button>
                </div>
              )}
              <button type="button" onClick={() => startEdit(selectedMedia)} className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                {isFa ? 'ویرایش Metadata' : 'Edit Metadata'}
              </button>
            </div>
          ) : (
            <div className="admin-card p-8 text-center text-slate-500 text-xs">
              {isFa ? 'برای مشاهده عملیات، یک رسانه را انتخاب کنید.' : 'Select a media item to manage it.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
