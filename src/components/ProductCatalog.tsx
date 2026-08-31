import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BearingProduct, Language } from '../types';
import { translations } from '../data/translations';
import { searchAndRankProducts } from '../utils/search';
import { PartMediaSlider } from './PartMediaSlider';
import { ProductCardSkeleton, ProductTableSkeleton } from './Skeletons';
import { 
  Search, 
  SlidersHorizontal, 
  Layers, 
  CheckCircle2, 
  RotateCw, 
  LayoutGrid, 
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles
} from 'lucide-react';

interface ProductCatalogProps {
  products: BearingProduct[];
  language: Language;
  onSelectProduct: (product: BearingProduct) => void;
  onNavigateProduct?: (slug: string) => void;
  selectedBearingCode?: string;
  initialCategory?: string;
}

const INITIAL_VISIBLE_COUNT = 6;

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  language,
  onSelectProduct,
  selectedBearingCode,
  initialCategory = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(selectedBearingCode || '');
  const [minD, setMinD] = useState<string>('');
  const [maxD, setMaxD] = useState<string>('');
  const [minOuterD, setMinOuterD] = useState<string>('');
  const [maxOuterD, setMaxOuterD] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  
  // Perceived performance loading state for smooth skeleton transitions
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const t = translations[language];

  // Quick preset chips for rapid engineering exploration
  const quickFilterPresets = useMemo(() => [
    { id: '6200-quick', labelFa: '⚡ موتور الکتریکی (6200/6300)', labelEn: '⚡ Motors (6200/6300)', query: '620' },
    { id: '22200-quick', labelFa: '🔥 کوره و ارتعاشات سنگین (22200)', labelEn: '🔥 Kiln & Vibratory (22200)', query: '222' },
    { id: '30200-quick', labelFa: '⚙️ گیربکس و اکسل (30200/32200)', labelEn: '⚙️ Gearbox & Pinion (30200)', query: '302' },
    { id: 'nu-quick', labelFa: '🏭 بار شعاعی سنگین (NU/NJ)', labelEn: '🏭 Heavy Radial (NU/NJ)', query: 'NU' },
    { id: 'housing-quick', labelFa: '🔩 یاتاقان کامل (UCP/UCF)', labelEn: '🔩 Housings (UCP/UCF)', query: 'UCP' },
    { id: 'seal-quick', labelFa: '🛡️ کاسه نمد و آب‌بند صنعتی', labelEn: '🛡️ Industrial Seals', query: 'TC' },
  ], []);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  // Trigger brief perceived loading on filter/search change
  useEffect(() => {
    setIsLoading(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [selectedCategory, searchQuery, minD, maxD, minOuterD, maxOuterD]);

  // If selectedBearingCode changes from props, update search query
  useEffect(() => {
    if (selectedBearingCode) {
      setSearchQuery(selectedBearingCode);
    }
  }, [selectedBearingCode]);

  // Reset visible count back to 2 rows (6 items) when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery, minD, maxD, minOuterD, maxOuterD]);

  const categories = [
    { id: 'all', label: t.catalog.categories.all },
    { id: 'ball', label: t.catalog.categories.ball },
    { id: 'roller', label: t.catalog.categories.roller },
    { id: 'spherical', label: t.catalog.categories.spherical },
    { id: 'cylindrical', label: t.catalog.categories.cylindrical },
    { id: 'thrust', label: t.catalog.categories.thrust },
    { id: 'housing', label: t.catalog.categories.housing },
    { id: 'seal', label: t.catalog.categories.seal },
    { id: 'lubricant', label: t.catalog.categories.lubricant },
  ];

  const filteredProducts = useMemo(() => {
    return searchAndRankProducts(products, searchQuery, {
      category: selectedCategory,
      minD: minD ? Number(minD) : undefined,
      maxD: maxD ? Number(maxD) : undefined,
      minOuterD: minOuterD ? Number(minOuterD) : undefined,
      maxOuterD: maxOuterD ? Number(maxOuterD) : undefined,
    });
  }, [products, selectedCategory, searchQuery, minD, maxD, minOuterD, maxOuterD]);

  const handleProductClick = (product: BearingProduct) => {
    onSelectProduct(product);
  };

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMinD('');
    setMaxD('');
    setMinOuterD('');
    setMaxOuterD('');
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleApplyPreset = (preset: typeof quickFilterPresets[0]) => {
    setSearchQuery(preset.query);
  };

  const hasActiveFilters = Boolean(
    searchQuery || 
    selectedCategory !== 'all' || 
    minD || 
    maxD || 
    minOuterD || 
    maxOuterD
  );

  return (
    <section id="catalog" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-12 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{t.catalog.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.catalog.title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            {t.catalog.subtitle}
          </p>
        </div>

        {/* Top Category Tabs (Apple Frosted Glass Capsule Bar) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none no-scrollbar mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#232c86] text-white shadow-md shadow-blue-900/20 font-bold scale-[1.02]'
                    : 'glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/80 font-medium'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Enhanced Search & Dimension Filter Panel */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl mb-8 sm:mb-10 space-y-4">
          
          {/* Streamlined Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Direct Intelligent Search Input Field */}
            <div className="relative flex-1 flex items-center bg-white/90 rounded-2xl border border-slate-200/80 shadow-inner focus-within:ring-2 focus-within:ring-[#232c86]/30 focus-within:border-[#232c86] transition-all overflow-hidden">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'fa'
                    ? 'جستجوی هوشمند در کاتالوگ (شماره فنی مانند 6205، 22216، ابعاد، کاربرد صنعتی یا برند)...'
                    : 'Search catalog by part number (e.g. 6205, 22216), dimensions, application or brand...'
                }
                className="w-full pl-10 pr-9 py-3 text-xs sm:text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
              />

              {/* Clear Input (X) Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                  title={language === 'fa' ? 'پاک کردن متن جستجو' : 'Clear search text'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controls: Dimensional Filter Toggle, Reset & View Mode */}
            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start shrink-0">
              <button
                id="toggle-dim-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  showFilters || minD || maxD || minOuterD || maxOuterD
                    ? 'bg-blue-50/90 border-[#232c86] text-[#232c86] shadow-xs'
                    : 'glass-btn-secondary text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-[#232c86]" />
                <span>{t.catalog.filterByDim}</span>
              </button>

              {hasActiveFilters && (
                <button
                  id="reset-all-catalog-filters-btn"
                  onClick={handleResetFilters}
                  className="px-3.5 py-3 rounded-2xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer"
                >
                  {t.catalog.resetFilters}
                </button>
              )}

              {/* Grid / Table View Switcher */}
              <div className="flex items-center rounded-2xl bg-slate-200/70 backdrop-blur-md p-1 border border-white/80">
                <button
                  id="catalog-grid-view-btn"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-white text-[#232c86] shadow-sm font-bold' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={t.catalog.gridView}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  id="catalog-table-view-btn"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    viewMode === 'table' 
                      ? 'bg-white text-[#232c86] shadow-sm font-bold' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={t.catalog.tableView}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Quick Preset Chips for 1-Click Search Discovery */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {language === 'fa' ? 'پیش‌فرض‌های مهندسی:' : 'Quick Presets:'}
            </span>
            {quickFilterPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap bg-white/70 hover:bg-white text-slate-700 hover:text-[#232c86] border border-slate-200/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {language === 'fa' ? preset.labelFa : preset.labelEn}
              </button>
            ))}
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/50">
              <span className="text-[11px] text-slate-400 font-semibold">
                {language === 'fa' ? 'فیلترهای فعال:' : 'Active Filters:'}
              </span>

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#232c86] text-xs font-semibold">
                  <span>{categories.find((c) => c.id === selectedCategory)?.label}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-red-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold font-mono-spec">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(minD || maxD || minOuterD || maxOuterD) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold font-mono-spec">
                  <span>ابعاد: {minD || '0'}-{maxD || '∞'} / {minOuterD || '0'}-{maxOuterD || '∞'} mm</span>
                  <button 
                    onClick={() => { setMinD(''); setMaxD(''); setMinOuterD(''); setMaxOuterD(''); }} 
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Expandable Dimensional Filters Box */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {language === 'fa' ? 'حداقل قطر داخلی (d min)' : 'Bore Min (d mm)'}:
                </label>
                <input
                  type="number"
                  value={minD}
                  onChange={(e) => setMinD(e.target.value)}
                  placeholder="20 mm"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-slate-900 font-mono-spec focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {language === 'fa' ? 'حداکثر قطر داخلی (d max)' : 'Bore Max (d mm)'}:
                </label>
                <input
                  type="number"
                  value={maxD}
                  onChange={(e) => setMaxD(e.target.value)}
                  placeholder="100 mm"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-slate-900 font-mono-spec focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {language === 'fa' ? 'حداقل قطر خارجی (D min)' : 'Outer Dia Min (D mm)'}:
                </label>
                <input
                  type="number"
                  value={minOuterD}
                  onChange={(e) => setMinOuterD(e.target.value)}
                  placeholder="40 mm"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-slate-900 font-mono-spec focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {language === 'fa' ? 'حداکثر قطر خارجی (D max)' : 'Outer Dia Max (D mm)'}:
                </label>
                <input
                  type="number"
                  value={maxOuterD}
                  onChange={(e) => setMaxOuterD(e.target.value)}
                  placeholder="200 mm"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-slate-900 font-mono-spec focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/40">
            <span className="font-medium">
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  {language === 'fa' ? 'در حال بازیابی کاتالوگ...' : 'Fetching catalog results...'}
                </span>
              ) : (
                <span>{filteredProducts.length} {t.catalog.resultsCount}</span>
              )}
            </span>
            <span className="font-mono-spec text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'fa' ? 'تضمین اصالت ۱۰۰٪ فیزیکی قطعات' : '100% Genuine Physical Guarantee'}
            </span>
          </div>
        </div>

        {/* Loading Skeleton View: Grid */}
        {isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Loading Skeleton View: Table */}
        {isLoading && viewMode === 'table' && (
          <ProductTableSkeleton count={6} />
        )}

        {/* Product Cards: Grid View */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                id={`bearing-card-${product.id}`}
                onClick={() => handleProductClick(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleProductClick(product)}
                className="glass-card rounded-3xl flex flex-col justify-between overflow-hidden group p-5 sm:p-6 cursor-pointer hover:border-blue-500/40 hover:shadow-xl hover:bg-white/95 transition-all duration-200 active:scale-[0.99]"
              >
                {/* Card Top: Code, Brand Badges & Schematic */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-bold font-mono-spec px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#232c86] border border-blue-500/20 block w-fit mb-1.5">
                        {product.code}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#232c86] transition-colors">
                        {language === 'fa' ? product.nameFa : product.nameEn}
                      </h3>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 whitespace-nowrap">
                      {t.catalog.card.inStock}
                    </span>
                  </div>

                  {/* Part Media Slider (CAD Schematic & Real Photo) */}
                  <div className="my-3 rounded-2xl overflow-hidden">
                    <PartMediaSlider 
                      product={product} 
                      language={language} 
                      className="h-36 sm:h-40" 
                    />
                  </div>

                  {/* Dimensions Metric Callouts */}
                  {product.d > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-2 bg-slate-100/60 backdrop-blur-sm rounded-2xl text-center border border-white/80 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.catalog.card.inner}</span>
                        <span className="text-xs font-bold font-mono-spec text-slate-800">
                          {product.d} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.catalog.card.outer}</span>
                        <span className="text-xs font-bold font-mono-spec text-slate-800">
                          {product.D} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.catalog.card.width}</span>
                        <span className="text-xs font-bold font-mono-spec text-slate-800">
                          {product.B} mm
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Load Rating & Brands */}
                  <div className="space-y-1.5 sm:space-y-2 text-xs">
                    {product.crKn > 0 && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{t.catalog.card.dynamic}:</span>
                        <span className="font-mono-spec font-bold text-[#232c86]">
                          {product.crKn} kN
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span>{language === 'fa' ? 'برندهای موجود:' : 'Brands:'}</span>
                      <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">
                        {product.brands.join(' • ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Cards: Table View */}
        {!isLoading && viewMode === 'table' && (
          <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-100/70 backdrop-blur-md text-slate-700 font-bold border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.code}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.type}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.dimensions}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.crKn}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.corKn}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.maxRpm}</th>
                  <th className="py-3.5 px-4 text-start">{t.catalog.tableHeaders.brand}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 text-slate-700">
                {displayedProducts.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => handleProductClick(p)} 
                    className="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono-spec font-bold text-[#232c86] group-hover:underline">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {language === 'fa' ? p.nameFa : p.nameEn}
                    </td>
                    <td className="py-3 px-4 font-mono-spec">
                      {p.d > 0 ? `${p.d} × ${p.D} × ${p.B} mm` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono-spec text-[#232c86] font-semibold">
                      {p.crKn > 0 ? `${p.crKn} kN` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono-spec">
                      {p.corKn > 0 ? `${p.corKn} kN` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono-spec">
                      {p.speedGreaseRpm > 0 ? `${p.speedGreaseRpm.toLocaleString()} RPM` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.brands.slice(0, 2).map((b) => (
                          <span key={b} className="px-1.5 py-0.5 rounded-lg glass-pill text-[10px] font-mono-spec">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State when no results match */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="glass-card p-10 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'fa' ? 'هیچ قطعه‌ای مطابق با فیلترهای انتخابی یافت نشد' : 'No components found matching your search'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'fa' 
                ? 'می‌توانید فیلترهای ابعادی، برند یا عبارت جستجو را تغییر دهید یا با کارشناسان فنی ما تماس بگیرید.'
                : 'Try adjusting your dimension ranges, brand filters, or search terms, or contact our engineering desk.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-xl bg-[#232c86] text-white text-xs font-bold shadow-sm hover:bg-[#1a2166] transition-all cursor-pointer"
            >
              {t.catalog.resetFilters}
            </button>
          </div>
        )}

        {/* View More / Show Less Toggle Button (Two Rows Preview Limit) */}
        {!isLoading && filteredProducts.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-8 sm:mt-10 flex justify-center">
            {visibleCount < filteredProducts.length ? (
              <button
                id="catalog-view-more-btn"
                onClick={() => setVisibleCount(filteredProducts.length)}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full glass-btn-primary text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{t.catalog.viewMore}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-mono-spec font-semibold">
                  +{filteredProducts.length - visibleCount}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="catalog-view-less-btn"
                onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn-secondary text-slate-700 font-semibold text-xs transition-all hover:text-[#232c86] active:scale-95 cursor-pointer"
              >
                <span>{t.catalog.viewLess}</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
