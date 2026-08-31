import React, { useState, useEffect } from 'react';
import { Language, BearingProduct } from '../../types';
import { AdminProductItem } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { 
  Image as ImageIcon, 
  Search, 
  Edit, 
  CheckCircle2, 
  Upload, 
  ExternalLink, 
  Layers, 
  Cpu,
  Sparkles
} from 'lucide-react';

interface AdminMediaProps {
  language: Language;
}

export const AdminMedia: React.FC<AdminMediaProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AdminProductItem | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribeToProducts(setProducts);
    return () => unsub();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return p.code.toLowerCase().includes(q) || (p.nameFa || '').toLowerCase().includes(q);
  });

  const handleSelectToEdit = (p: AdminProductItem) => {
    setSelectedProduct(p);
    setNewImageUrl(p.imageUrl || '/icon.png');
    setSavedSuccess(false);
  };

  const handleSaveImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    dataService.updateProduct(
      selectedProduct.id,
      {
        imageUrl: newImageUrl.trim() || '/icon.png',
        images: [newImageUrl.trim() || '/icon.png'],
      },
      'admin'
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'مدیریت رسانه و تصاویر محصولات' : 'Product Media & Image Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'مشاهده و جایگزینی تصاویر قطعات کاتالوگ و پیوندهای شماتیک سه‌بعدی بدون نیاز به تغییر کد منبع' 
              : 'Manage product gallery assets and 3D schematics without modifying React components'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Product Media Gallery Grid */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isFa ? 'جستجوی تصویر بر اساس کد فنی...' : 'Search media by product code...'}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-xs text-white placeholder-slate-500 font-mono ${isFa ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'}`}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectToEdit(product)}
                  className={`
                    p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center
                    ${isSelected 
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'}
                  `}
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden mb-2">
                    <img
                      src={product.imageUrl || '/icon.png'}
                      alt={product.code}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/icon.png';
                      }}
                    />
                  </div>
                  <span className="font-mono font-bold text-white text-xs block truncate w-full">
                    {product.code}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize block truncate w-full mt-0.5">
                    {product.schematicType}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right: Media Editor Inspector */}
        <div className="lg:col-span-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sticky top-24 space-y-5">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Edit className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'ویرایشگر آدرس رسانه' : 'Media Inspector'}</span>
            </h3>

            {selectedProduct ? (
              <form onSubmit={handleSaveImage} className="space-y-4">
                
                {/* Large Preview */}
                <div className="w-full h-44 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden p-4">
                  <img
                    src={newImageUrl || '/icon.png'}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.png';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-0.5 font-mono">
                    {selectedProduct.code}
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    {isFa ? selectedProduct.nameFa : selectedProduct.nameEn}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'آدرس URL تصویر (Image URL)' : 'Image Asset URL'}
                  </label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="/icon.png or https://..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isFa ? 'تصویر با موفقیت به‌روزرسانی شد.' : 'Image updated successfully.'}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  {isFa ? 'ذخیره آدرس تصویر' : 'Save Image URL'}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs leading-relaxed">
                {isFa 
                  ? 'جهت ویرایش تصویر، یکی از محصولات را از لیست سمت چپ انتخاب فرمایید.' 
                  : 'Select a product from the list on the left to inspect or update its media.'}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
