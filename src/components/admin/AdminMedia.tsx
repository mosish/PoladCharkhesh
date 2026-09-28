import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { AdminProductItem, MediaCategory, MediaMetadata, MediaUploadInput } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { mediaService } from '../../services/mediaService';
import {
  Image as ImageIcon,
  Search,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  FileText,
  Library,
  Package,
  RefreshCw,
  Save,
  Link2,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface AdminMediaProps {
  language: Language;
}

type MediaTab = 'library' | 'products';

const emptyMediaForm: MediaUploadInput = {
  filename: '',
  originalName: '',
  mimeType: 'image/webp',
  sizeBytes: 0,
  url: '',
  altTextFa: '',
  altTextEn: '',
  category: 'product_photo',
  associatedProductCodes: [],
};

export const AdminMedia: React.FC<AdminMediaProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [tab, setTab] = useState<MediaTab>('library');

  // Shared status
  const [status, setStatus] = useState<{ success?: string; error?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Media library state
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MediaCategory>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaMetadata | null>(null);
  const [mediaForm, setMediaForm] = useState<MediaUploadInput>({ ...emptyMediaForm });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const productImgInputRef = React.useRef<HTMLInputElement>(null);
  const productPdfInputRef = React.useRef<HTMLInputElement>(null);

  // Product gallery state
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AdminProductItem | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribeToAllProducts(setProducts);
    return () => unsub();
  }, []);

  const refreshMedia = async () => {
    const result = await mediaService.getMediaList();
    if (result.success) {
      setMedia(result.data.media || []);
    } else {
      setStatus({ error: result.error.message });
    }
  };

  useEffect(() => {
    refreshMedia();
  }, []);

  const filteredMedia = useMemo(() => {
    const q = mediaSearch.trim().toLowerCase();
    return media.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return [
        item.filename,
        item.originalName,
        item.url,
        item.altTextFa,
        item.altTextEn,
        ...(item.associatedProductCodes || []),
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [media, mediaSearch, categoryFilter]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.code.toLowerCase().includes(q) ||
      (p.nameFa || '').toLowerCase().includes(q) ||
      (p.nameEn || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const selectMedia = (item: MediaMetadata) => {
    setSelectedMedia(item);
    setMediaForm({
      filename: item.filename,
      originalName: item.originalName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      url: item.url,
      altTextFa: item.altTextFa || '',
      altTextEn: item.altTextEn || '',
      category: item.category || 'product_photo',
      associatedProductCodes: [...(item.associatedProductCodes || [])],
    });
    setStatus({});
  };

  const startNewMedia = () => {
    setSelectedMedia(null);
    setMediaForm({ ...emptyMediaForm, associatedProductCodes: [] });
    setStatus({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus({});
    try {
      const result = await mediaService.uploadMedia(file);
      if (result.success) {
        await refreshMedia();
        selectMedia(result.data.media);
        setStatus({
          success: isFa ? `فایل «${file.name}» با موفقیت بارگذاری شد.` : `File "${file.name}" uploaded successfully.`,
        });
      } else {
        setStatus({ error: result.error.message });
      }
    } catch {
      setStatus({ error: isFa ? 'خطا در بارگذاری فایل.' : 'Failed to upload file.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;
    setIsUploading(true);
    setStatus({});
    try {
      const result = await mediaService.uploadMedia(file);
      if (result.success) {
        await refreshMedia();
        const uploadedUrl = result.data.media.url;
        setGalleryImages((prev) => [...prev, uploadedUrl]);
        setStatus({
          success: isFa ? `تصویر بارگذاری و به پیش‌نمایش گالری قطعه ${selectedProduct.code} افزوده شد.` : `Image uploaded and appended to ${selectedProduct.code} gallery.`,
        });
      } else {
        setStatus({ error: result.error.message });
      }
    } catch {
      setStatus({ error: isFa ? 'خطا در بارگذاری تصویر.' : 'Failed to upload image.' });
    } finally {
      setIsUploading(false);
      if (productImgInputRef.current) productImgInputRef.current.value = '';
    }
  };

  const handleProductPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;
    setIsUploading(true);
    setStatus({});
    try {
      const result = await mediaService.uploadMedia(file);
      if (result.success) {
        await refreshMedia();
        const uploadedUrl = result.data.media.url;
        setPdfUrl(uploadedUrl);
        setStatus({
          success: isFa ? `دیتاشیت PDF بارگذاری و برای قطعه ${selectedProduct.code} تنظیم شد.` : `Datasheet PDF uploaded and set for ${selectedProduct.code}.`,
        });
      } else {
        setStatus({ error: result.error.message });
      }
    } catch {
      setStatus({ error: isFa ? 'خطا در بارگذاری دیتاشیت.' : 'Failed to upload datasheet.' });
    } finally {
      setIsUploading(false);
      if (productPdfInputRef.current) productPdfInputRef.current.value = '';
    }
  };

  const saveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({});

    const normalized: MediaUploadInput = {
      ...mediaForm,
      filename: mediaForm.filename?.trim() || mediaForm.originalName.trim(),
      originalName: mediaForm.originalName.trim(),
      url: mediaForm.url.trim(),
      mimeType: mediaForm.mimeType.trim() || 'application/octet-stream',
      sizeBytes: Number(mediaForm.sizeBytes) || 0,
      altTextFa: mediaForm.altTextFa?.trim() || '',
      altTextEn: mediaForm.altTextEn?.trim() || '',
      associatedProductCodes: (mediaForm.associatedProductCodes || []).map((c) => c.trim()).filter(Boolean),
    };

    const result = selectedMedia
      ? await mediaService.updateMedia(selectedMedia.id, normalized)
      : await mediaService.createMedia(normalized);

    if (!result.success) {
      setStatus({ error: result.error.message });
      setIsSaving(false);
      return;
    }

    await refreshMedia();
    const saved = result.data.media;
    selectMedia(saved);
    setStatus({ success: isFa ? 'اطلاعات رسانه ذخیره شد.' : 'Media metadata saved.' });
    setIsSaving(false);
  };

  const deleteMedia = async () => {
    if (!selectedMedia) return;
    const confirmed = window.confirm(
      isFa
        ? `رسانه «${selectedMedia.originalName}» از کتابخانه حذف شود؟ این عملیات فایل فیزیکی روی سرور را حذف نمی‌کند.`
        : `Remove “${selectedMedia.originalName}” from the media library? Uploaded files are retained for backup recovery.`
    );
    if (!confirmed) return;

    const result = await mediaService.deleteMedia(selectedMedia.id);
    if (!result.success) {
      setStatus({ error: result.error.message });
      return;
    }

    startNewMedia();
    await refreshMedia();
    setStatus({ success: isFa ? 'رکورد رسانه حذف شد.' : 'Media record removed.' });
  };

  const selectProduct = (product: AdminProductItem) => {
    setSelectedProduct(product);
    const existing = [...new Set([product.imageUrl, ...(product.images || [])].filter((url): url is string => !!url))];
    setGalleryImages(existing);
    setPdfUrl(product.pdfUrl || '');
    setNewImageUrl('');
    setStatus({});
  };

  const addGalleryImage = () => {
    const url = newImageUrl.trim();
    if (!url || galleryImages.includes(url)) return;
    setGalleryImages((prev) => [...prev, url]);
    setNewImageUrl('');
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= galleryImages.length) return;
    const next = [...galleryImages];
    [next[index], next[target]] = [next[target], next[index]];
    setGalleryImages(next);
  };

  const setPrimaryImage = (index: number) => {
    if (index <= 0 || index >= galleryImages.length) return;
    const next = [...galleryImages];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    setGalleryImages(next);
  };

  const saveProductGallery = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    setStatus({});

    const nextImages = galleryImages.filter(Boolean);
    const result = await dataService.updateProduct(
      selectedProduct.id,
      {
        imageUrl: nextImages[0] || '',
        images: nextImages,
        pdfUrl: pdfUrl.trim(),
      },
      'admin'
    );

    if (!result.success) {
      setStatus({ error: result.errors?.join(' ') || (isFa ? 'ذخیره گالری انجام نشد.' : 'Failed to save product gallery.') });
      setIsSaving(false);
      return;
    }

    if (result.product) selectProduct(result.product as AdminProductItem);
    setStatus({ success: isFa ? 'گالری و دیتاشیت محصول ذخیره شد.' : 'Product gallery and datasheet saved.' });
    setIsSaving(false);
  };

  const categoryOptions: Array<{ value: MediaCategory; fa: string; en: string }> = [
    { value: 'product_photo', fa: 'تصویر محصول', en: 'Product Photo' },
    { value: 'cad_schematic', fa: 'شماتیک / CAD', en: 'CAD / Schematic' },
    { value: 'datasheet_pdf', fa: 'دیتاشیت PDF', en: 'Datasheet PDF' },
    { value: 'company_photo', fa: 'تصویر شرکت', en: 'Company Photo' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Library className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'کتابخانه رسانه و دیتاشیت' : 'Media & Datasheet Library'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa
              ? 'مدیریت metadata رسانه‌ها، ارتباط با محصولات و گالری هر محصول بدون overwrite ناخواسته'
              : 'Manage media metadata, product associations, and product galleries without destructive overwrites.'}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button type="button" onClick={() => setTab('library')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'library' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            {isFa ? 'کتابخانه' : 'Library'}
          </button>
          <button type="button" onClick={() => setTab('products')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            {isFa ? 'گالری محصولات' : 'Product Galleries'}
          </button>
        </div>
      </div>

      {(status.success || status.error) && (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${status.error ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          {status.error || status.success}
        </div>
      )}

      {tab === 'library' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-500" />
                <input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder={isFa ? 'جستجوی فایل، alt text یا کد محصول...' : 'Search filename, alt text, or product code...'} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as 'all' | MediaCategory)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                <option value="all">{isFa ? 'همه دسته‌ها' : 'All Categories'}</option>
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{isFa ? option.fa : option.en}</option>)}
              </select>
              <button type="button" onClick={refreshMedia} className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer transition-all shrink-0">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? (isFa ? 'در حال بارگذاری...' : 'Uploading...') : (isFa ? 'بارگذاری فایل' : 'Upload File')}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              <button type="button" onClick={startNewMedia} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0"><Plus className="w-4 h-4" />{isFa ? 'رسانه جدید' : 'New Media'}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto">
              {filteredMedia.map((item) => (
                <button key={item.id} type="button" onClick={() => selectMedia(item)} className={`text-start p-3 rounded-xl border transition-colors ${selectedMedia?.id === item.id ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                  <div className="aspect-video rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center mb-2">
                    {item.mimeType.startsWith('image/') ? <img src={item.url} alt={isFa ? item.altTextFa || item.originalName : item.altTextEn || item.originalName} className="w-full h-full object-contain" /> : <FileText className="w-7 h-7 text-rose-400" />}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{item.originalName}</div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">{item.category || item.mimeType}</div>
                  {(item.associatedProductCodes || []).length > 0 && <div className="text-[10px] text-indigo-300 mt-1 truncate">{item.associatedProductCodes?.join(' · ')}</div>}
                </button>
              ))}
              {filteredMedia.length === 0 && <div className="sm:col-span-2 lg:col-span-3 py-14 text-center text-xs text-slate-500">{isFa ? 'رسانه‌ای ثبت نشده است.' : 'No media records found.'}</div>}
            </div>
          </div>

          <form onSubmit={saveMedia} className="xl:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{selectedMedia ? (isFa ? 'ویرایش رسانه' : 'Edit Media') : (isFa ? 'ثبت رسانه' : 'Register Media')}</h3>
              {selectedMedia && <button type="button" onClick={deleteMedia} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"><Trash2 className="w-4 h-4" /></button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={mediaForm.originalName} onChange={(e) => setMediaForm((p) => ({ ...p, originalName: e.target.value }))} placeholder={isFa ? 'نام اصلی فایل' : 'Original name'} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
              <input value={mediaForm.filename || ''} onChange={(e) => setMediaForm((p) => ({ ...p, filename: e.target.value }))} placeholder={isFa ? 'نام فایل روی سرور' : 'Server filename'} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
            </div>

            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input required value={mediaForm.url} onChange={(e) => setMediaForm((p) => ({ ...p, url: e.target.value }))} placeholder="/assets/... or https://..." className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={mediaForm.category || 'product_photo'} onChange={(e) => setMediaForm((p) => ({ ...p, category: e.target.value as MediaCategory }))} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{isFa ? option.fa : option.en}</option>)}
              </select>
              <input value={mediaForm.mimeType} onChange={(e) => setMediaForm((p) => ({ ...p, mimeType: e.target.value }))} placeholder="image/webp" className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
              <input type="number" min="0" value={mediaForm.sizeBytes} onChange={(e) => setMediaForm((p) => ({ ...p, sizeBytes: Number(e.target.value) }))} placeholder="Bytes" className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>

            <textarea value={mediaForm.altTextFa || ''} onChange={(e) => setMediaForm((p) => ({ ...p, altTextFa: e.target.value }))} rows={2} placeholder="Alt text فارسی" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
            <textarea value={mediaForm.altTextEn || ''} onChange={(e) => setMediaForm((p) => ({ ...p, altTextEn: e.target.value }))} rows={2} placeholder="English alt text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
            <input value={(mediaForm.associatedProductCodes || []).join(', ')} onChange={(e) => setMediaForm((p) => ({ ...p, associatedProductCodes: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} placeholder={isFa ? 'کد محصولات مرتبط، جداشده با ویرگول' : 'Associated product codes, comma-separated'} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />

            <button type="submit" disabled={isSaving} className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold">
              <Save className="w-4 h-4" />{isSaving ? (isFa ? 'در حال ذخیره...' : 'Saving...') : (isFa ? 'ذخیره رسانه' : 'Save Media')}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-500" />
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={isFa ? 'جستجوی محصول...' : 'Search products...'} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white" />
            </div>
            <div className="max-h-[680px] overflow-y-auto space-y-2">
              {filteredProducts.map((product) => (
                <button key={product.id} type="button" onClick={() => selectProduct(product)} className={`w-full text-start flex items-center gap-3 p-3 rounded-xl border ${selectedProduct?.id === product.id ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                  <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.code} className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white truncate">{product.code}</div>
                    <div className="text-[10px] text-slate-500 truncate">{isFa ? product.nameFa : product.nameEn}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="xl:col-span-8 bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
            {!selectedProduct ? (
              <div className="py-20 text-center text-xs text-slate-500">{isFa ? 'یک محصول را برای مدیریت گالری انتخاب کنید.' : 'Select a product to manage its gallery.'}</div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedProduct.code}</h3>
                  <p className="text-xs text-slate-500">{isFa ? selectedProduct.nameFa : selectedProduct.nameEn}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {galleryImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                      <div className="relative aspect-video rounded-lg bg-slate-950 overflow-hidden flex items-center justify-center">
                        <img src={url} alt={selectedProduct.code} className="w-full h-full object-contain" />
                        {index === 0 && <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold"><Star className="w-3 h-3 fill-current" />{isFa ? 'اصلی' : 'Primary'}</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono" title={url}>{url}</div>
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => setPrimaryImage(index)} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 disabled:opacity-30" title="Set primary"><Star className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={index === galleryImages.length - 1} onClick={() => moveGalleryImage(index, 1)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => removeGalleryImage(index)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder={isFa ? 'URL تصویر جدید' : 'New image URL'} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
                  <button type="button" onClick={addGalleryImage} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"><Plus className="w-4 h-4" />{isFa ? 'افزودن URL' : 'Add URL'}</button>
                  <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? (isFa ? 'در حال بارگذاری...' : 'Uploading...') : (isFa ? 'بارگذاری تصویر' : 'Upload Image')}</span>
                    <input
                      ref={productImgInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProductImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{isFa ? 'آدرس دیتاشیت PDF محصول' : 'Product Datasheet PDF URL'}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="/datasheets/... or /uploads/..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
                    <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? (isFa ? 'در حال بارگذاری...' : 'Uploading...') : (isFa ? 'بارگذاری PDF' : 'Upload PDF')}</span>
                      <input
                        ref={productPdfInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleProductPdfUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button type="button" disabled={isSaving} onClick={saveProductGallery} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />{isSaving ? (isFa ? 'در حال ذخیره...' : 'Saving...') : (isFa ? 'ذخیره گالری محصول' : 'Save Product Gallery')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
