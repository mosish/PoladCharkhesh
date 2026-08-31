import React, { useState, useEffect } from 'react';
import { Language, BearingCategory, BearingProduct } from '../../types';
import { AdminProductItem } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { ProductFormModal } from './ProductFormModal';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Archive, 
  Undo, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Filter,
  Layers,
  ArrowUpDown,
  Calculator
} from 'lucide-react';

interface AdminProductsProps {
  language: Language;
  onOpenProductPage?: (slug: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  language,
  onOpenProductPage,
}) => {
  const isFa = language === 'fa';

  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribeToProducts(setProducts);
    return () => unsub();
  }, []);

  // Filter products
  const filteredProducts = products.filter((product) => {
    // 1. Status
    if (statusFilter === 'active' && product.isArchived) return false;
    if (statusFilter === 'archived' && !product.isArchived) return false;

    // 2. Category
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;

    // 3. Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const codeMatch = product.code.toLowerCase().includes(q);
      const nameFaMatch = (product.nameFa || '').toLowerCase().includes(q);
      const nameEnMatch = (product.nameEn || '').toLowerCase().includes(q);
      const dimMatch = `${product.d}x${product.D}x${product.B}`.includes(q);
      const brandMatch = (product.brands || []).some((b) => b.toLowerCase().includes(q));

      return codeMatch || nameFaMatch || nameEnMatch || dimMatch || brandMatch;
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: AdminProductItem) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = (data: Partial<BearingProduct>): { success: boolean; errors?: string[] } => {
    if (editingProduct) {
      return dataService.updateProduct(editingProduct.id, data, 'admin');
    } else {
      return dataService.addProduct(data, 'admin');
    }
  };

  const handleToggleArchive = (id: string, code: string, isArchived?: boolean) => {
    const actionName = isArchived ? (isFa ? 'بازیابی' : 'restore') : (isFa ? 'بایگانی' : 'archive');
    if (window.confirm(isFa ? `آیا از ${actionName} قطعه ${code} اطمینان دارید؟` : `Confirm ${actionName} for ${code}?`)) {
      dataService.toggleArchiveProduct(id, 'admin');
    }
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(isFa ? `⚠️ هشدار امنیتی: آیا از حذف دائمی قطعه ${code} اطمینان کامل دارید؟` : `⚠️ Are you sure you want to permanently delete product ${code}?`)) {
      dataService.deleteProduct(id, 'admin');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'مدیریت کاتالوگ محصولات مهندسی' : 'Engineering Product Catalog'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? `مجموعاً ${products.length} ردیف کالایی استاندارد ثبت شده با مشخصات فنی و ضرایب ISO 281` 
              : `Total of ${products.length} catalog items with verified ISO specifications`}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isFa ? 'افزودن محصول جدید' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isFa ? 'جستجو بر اساس شماره فنی، نام، ابعاد یا برند...' : 'Search by code, name, dimensions or brand...'}
              className={`
                w-full bg-slate-900 border border-slate-700 rounded-xl py-2 text-xs text-white placeholder-slate-500
                focus:border-indigo-500 focus:outline-none font-mono
                ${isFa ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'}
              `}
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{isFa ? 'همه دسته‌ها' : 'All Categories'}</option>
              <option value="roller">{isFa ? 'رولبرینگ مخروطی' : 'Tapered Roller'}</option>
              <option value="spherical">{isFa ? 'رولبرینگ بشکه‌ای' : 'Spherical Roller'}</option>
              <option value="ball">{isFa ? 'بلبرینگ شیارعمیق' : 'Deep Groove Ball'}</option>
              <option value="cylindrical">{isFa ? 'رولبرینگ استوانه‌ای' : 'Cylindrical Roller'}</option>
              <option value="thrust">{isFa ? 'برینگ کف‌گرد' : 'Thrust Bearing'}</option>
              <option value="housing">{isFa ? 'یاتاقان و هوزینگ' : 'Bearing Housing'}</option>
              <option value="seal">{isFa ? 'کاسه‌نمد و آب‌بند' : 'Oil Seal'}</option>
              <option value="lubricant">{isFa ? 'روانکار صنعتی' : 'Lubricant'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Statuses'}</option>
              <option value="active">{isFa ? 'فقط فعال در کاتالوگ' : 'Active Only'}</option>
              <option value="archived">{isFa ? 'بایگانی‌شده‌ها' : 'Archived'}</option>
            </select>
          </div>

        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span>
            {isFa 
              ? `نمایش ${filteredProducts.length} از ${products.length} کالا` 
              : `Showing ${filteredProducts.length} of ${products.length} products`}
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isFa ? 'پاک کردن جستجو' : 'Clear search'}
            </button>
          )}
        </div>

      </div>

      {/* Products Data Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <th className="py-3 px-4 text-start">{isFa ? 'تصویر' : 'Image'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'کد فنی و نام کالا' : 'Code & Title'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'ابعاد (d×D×B)' : 'Dim (d×D×B)'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'ظرفیت بار (Cr/C0r)' : 'Loads (Cr/C0r)'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'ضرایب ISO (e, Y)' : 'Factors (e, Y)'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'برندها' : 'Brands'}</th>
                <th className="py-3 px-4 text-start">{isFa ? 'وضعیت' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{isFa ? 'عملیات' : 'Actions'}</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {isFa ? 'هیچ محصولی با معیارهای جستجو یافت نشد.' : 'No products match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const hasFactors = product.calculationFactorE !== undefined || product.calculationFactorY !== undefined;

                  return (
                    <tr 
                      key={product.id}
                      className={`hover:bg-slate-900/40 transition-colors ${product.isArchived ? 'opacity-60 bg-slate-950/40' : ''}`}
                    >
                      {/* Image */}
                      <td className="py-3 px-4">
                        <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={product.imageUrl || '/icon.png'}
                            alt={product.code}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/icon.png';
                            }}
                          />
                        </div>
                      </td>

                      {/* Code & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {product.code}
                          </span>
                          {product.featured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {isFa ? product.nameFa : product.nameEn}
                        </span>
                      </td>

                      {/* Dimensions */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {product.d} × {product.D} × {product.B} <span className="text-[10px] text-slate-500">mm</span>
                      </td>

                      {/* Load Ratings */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>
                          <span className="text-emerald-400 font-bold">{product.crKn}</span> / <span className="text-slate-400">{product.corKn}</span>
                          <span className="text-[10px] text-slate-500 ml-1">kN</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {product.speedGreaseRpm} RPM
                        </div>
                      </td>

                      {/* ISO Calculation Factors */}
                      <td className="py-3 px-4 font-mono text-xs">
                        {hasFactors ? (
                          <div className="space-y-0.5">
                            {product.calculationFactorE !== undefined && (
                              <span className="text-indigo-300 block">e = {product.calculationFactorE}</span>
                            )}
                            {product.calculationFactorY !== undefined && (
                              <span className="text-slate-400 block text-[10px]">Y = {product.calculationFactorY}</span>
                            )}
                            {product.calculationFactorY1 !== undefined && (
                              <span className="text-slate-400 block text-[10px]">Y1={product.calculationFactorY1} Y2={product.calculationFactorY2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            {product.category === 'ball' ? 'Standard Deep Groove' : 'Custom / Unset'}
                          </span>
                        )}
                      </td>

                      {/* Brands */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(product.brands || []).slice(0, 3).map((b) => (
                            <span key={b} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                              {b}
                            </span>
                          ))}
                          {(product.brands || []).length > 3 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{product.brands.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {product.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            <Archive className="w-3 h-3" />
                            <span>{isFa ? 'بایگانی' : 'Archived'}</span>
                          </span>
                        ) : product.inStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isFa ? 'موجود' : 'In Stock'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            <span>{isFa ? 'استعلامی' : 'Inquiry'}</span>
                          </span>
                        )}
                      </td>

                      {/* Action Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700 transition-colors"
                            title={isFa ? 'ویرایش مشخصات فنی' : 'Edit specs'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Archive/Restore */}
                          <button
                            onClick={() => handleToggleArchive(product.id, product.code, product.isArchived)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title={product.isArchived ? (isFa ? 'بازیابی' : 'Restore') : (isFa ? 'بایگانی' : 'Archive')}
                          >
                            {product.isArchived ? <Undo className="w-3.5 h-3.5 text-emerald-400" /> : <Archive className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(product.id, product.code)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                            title={isFa ? 'حذف محصول' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Product Edit / Add Modal */}
      <ProductFormModal
        language={language}
        product={editingProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
      />

    </div>
  );
};
