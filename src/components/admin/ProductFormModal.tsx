import React, { useState, useEffect } from 'react';
import { Language, BearingCategory, BearingSchematicType, BearingProduct } from '../../types';
import { AdminProductItem } from '../../types/admin';
import { 
  X, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Image as ImageIcon, 
  Building2, 
  FileText, 
  Globe, 
  Calculator,
  Plus,
  Trash2
} from 'lucide-react';

interface ProductFormModalProps {
  language: Language;
  product?: AdminProductItem | null; // null for add mode, item for edit mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<BearingProduct>) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] };
}

type ModalTab = 'identity' | 'dimensions' | 'factors' | 'media' | 'brands' | 'seo';

const CATEGORIES: Array<{ id: BearingCategory; nameFa: string; nameEn: string }> = [
  { id: 'roller', nameFa: 'رولبرینگ مخروطی (Tapered)', nameEn: 'Tapered Roller' },
  { id: 'spherical', nameFa: 'رولبرینگ بشکه‌ای (Spherical)', nameEn: 'Spherical Roller' },
  { id: 'ball', nameFa: 'بلبرینگ شیار عمیق (Deep Groove)', nameEn: 'Deep Groove Ball' },
  { id: 'cylindrical', nameFa: 'رولبرینگ استوانه‌ای (Cylindrical)', nameEn: 'Cylindrical Roller' },
  { id: 'thrust', nameFa: 'برینگ کف‌گرد (Thrust)', nameEn: 'Thrust Bearing' },
  { id: 'housing', nameFa: 'یاتاقان و هوزینگ (Housing)', nameEn: 'Bearing Housing' },
  { id: 'seal', nameFa: 'کاسه‌نمد و آب‌بند (Oil Seal)', nameEn: 'Oil Seal' },
  { id: 'lubricant', nameFa: 'روانکار و گریس صنعتی', nameEn: 'Industrial Lubricant' },
];

const SCHEMATICS: Array<{ id: BearingSchematicType; name: string }> = [
  { id: 'tapered', name: 'Tapered Roller (مخروطی)' },
  { id: 'spherical', name: 'Spherical Roller (بشکه‌ای)' },
  { id: 'deep-groove', name: 'Deep Groove Ball (شیار عمیق)' },
  { id: 'cylindrical', name: 'Cylindrical Roller (استوانه‌ای)' },
  { id: 'thrust', name: 'Thrust Bearing (کف‌گرد)' },
  { id: 'pillow-block', name: 'Pillow Block Housing (یاتاقان)' },
  { id: 'oil-seal', name: 'Radial Shaft Seal (کاسه‌نمد)' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  language,
  product,
  isOpen,
  onClose,
  onSave,
}) => {
  const isFa = language === 'fa';
  const isEditing = !!product;

  const [activeTab, setActiveTab] = useState<ModalTab>('identity');
  const [errors, setErrors] = useState<string[]>([]);

  // Form States
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<BearingCategory>('roller');
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);

  // Dimensions & Ratings
  const [d, setD] = useState<number | string>(50);
  const [D_dim, setD_dim] = useState<number | string>(90);
  const [B, setB] = useState<number | string>(21.75);
  const [weightKg, setWeightKg] = useState<number | string>(0.6);
  const [crKn, setCrKn] = useState<number | string>(75.0);
  const [corKn, setCorKn] = useState<number | string>(85.0);
  const [speedGreaseRpm, setSpeedGreaseRpm] = useState<number | string>(4500);
  const [speedOilRpm, setSpeedOilRpm] = useState<number | string>(6000);
  const [rMin, setRMin] = useState<number | string>(1.5);
  const [cageMaterialFa, setCageMaterialFa] = useState('فولاد پرسکاری شده حرارتی');
  const [cageMaterialEn, setCageMaterialEn] = useState('Stamped steel cage');
  const [sealingFa, setSealingFa] = useState('طراحی باز (نیاز به گریس/روغن)');
  const [sealingEn, setSealingEn] = useState('Open design');

  // Calculation Factors
  const [calculationFactorE, setCalculationFactorE] = useState<number | string>('');
  const [calculationFactorY, setCalculationFactorY] = useState<number | string>('');
  const [calculationFactorY0, setCalculationFactorY0] = useState<number | string>('');
  const [calculationFactorY1, setCalculationFactorY1] = useState<number | string>('');
  const [calculationFactorY2, setCalculationFactorY2] = useState<number | string>('');
  const [calculationFactorF0, setCalculationFactorF0] = useState<number | string>('');
  const [schematicType, setSchematicType] = useState<BearingSchematicType>('tapered');

  // Media
  const [imageUrl, setImageUrl] = useState('/icon.png');
  const [pdfUrl, setPdfUrl] = useState('');

  // Brands & Tags
  const [brands, setBrands] = useState<string[]>(['SKF', 'FAG', 'TIMKEN']);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [applicationsFa, setApplicationsFa] = useState<string[]>(['صنایع معدنی', 'گیربکس‌های صنعتی']);
  const [newAppFaInput, setNewAppFaInput] = useState('');

  // Technical Source & SEO
  const [sourceManufacturer, setSourceManufacturer] = useState('SKF Rolling Bearings Master Catalog');
  const [sourceReference, setSourceReference] = useState('Official ISO Engineering Data Table');
  const [metaTitleFa, setMetaTitleFa] = useState('');
  const [metaDescriptionFa, setMetaDescriptionFa] = useState('');

  // Initialize or Reset Form
  useEffect(() => {
    if (product) {
      setCode(product.code || '');
      setCategory(product.category || 'roller');
      setNameFa(product.nameFa || '');
      setNameEn(product.nameEn || '');
      setDescriptionFa(product.descriptionFa || '');
      setDescriptionEn(product.descriptionEn || '');
      setInStock(product.inStock !== false);
      setFeatured(!!product.featured);

      setD(product.d ?? '');
      setD_dim(product.D ?? '');
      setB(product.B ?? '');
      setWeightKg(product.weightKg ?? '');
      setCrKn(product.crKn ?? '');
      setCorKn(product.corKn ?? '');
      setSpeedGreaseRpm(product.speedGreaseRpm ?? '');
      setSpeedOilRpm(product.speedOilRpm ?? '');
      setRMin(product.rMin ?? '');
      setCageMaterialFa(product.cageMaterialFa || '');
      setCageMaterialEn(product.cageMaterialEn || '');
      setSealingFa(product.sealingFa || '');
      setSealingEn(product.sealingEn || '');

      setCalculationFactorE(product.calculationFactorE ?? '');
      setCalculationFactorY(product.calculationFactorY ?? '');
      setCalculationFactorY0(product.calculationFactorY0 ?? '');
      setCalculationFactorY1(product.calculationFactorY1 ?? '');
      setCalculationFactorY2(product.calculationFactorY2 ?? '');
      setCalculationFactorF0(product.calculationFactorF0 ?? '');
      setSchematicType(product.schematicType || 'tapered');

      setImageUrl(product.imageUrl || '/icon.png');
      setPdfUrl(product.pdfUrl || '');
      setBrands(product.brands && product.brands.length > 0 ? [...product.brands] : ['SKF', 'FAG', 'TIMKEN']);
      setApplicationsFa(product.applicationsFa && product.applicationsFa.length > 0 ? [...product.applicationsFa] : ['صنایع عمومی']);

      if (product.technicalSources && product.technicalSources.length > 0) {
        setSourceManufacturer(product.technicalSources[0].manufacturer || '');
        setSourceReference(product.technicalSources[0].reference || '');
      }

      setMetaTitleFa(product.metaTitleFa || '');
      setMetaDescriptionFa(product.metaDescriptionFa || '');
    } else {
      // Defaults for new product
      setCode('');
      setCategory('roller');
      setNameFa('');
      setNameEn('');
      setDescriptionFa('');
      setDescriptionEn('');
      setInStock(true);
      setFeatured(false);
      setD('');
      setD_dim('');
      setB('');
      setWeightKg('');
      setCrKn('');
      setCorKn('');
      setSpeedGreaseRpm('');
      setSpeedOilRpm('');
      setCalculationFactorE('');
      setCalculationFactorY('');
      setCalculationFactorY0('');
      setCalculationFactorY1('');
      setCalculationFactorY2('');
      setCalculationFactorF0('');
      setImageUrl('/icon.png');
      setPdfUrl('');
      setBrands(['SKF', 'FAG', 'TIMKEN']);
      setApplicationsFa(['صنایع سنگین']);
    }
    setErrors([]);
    setActiveTab('identity');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleAddBrand = () => {
    if (newBrandInput.trim() && !brands.includes(newBrandInput.trim().toUpperCase())) {
      setBrands([...brands, newBrandInput.trim().toUpperCase()]);
      setNewBrandInput('');
    }
  };

  const handleRemoveBrand = (b: string) => {
    setBrands(brands.filter((item) => item !== b));
  };

  const handleAddAppFa = () => {
    if (newAppFaInput.trim() && !applicationsFa.includes(newAppFaInput.trim())) {
      setApplicationsFa([...applicationsFa, newAppFaInput.trim()]);
      setNewAppFaInput('');
    }
  };

  const handleRemoveAppFa = (app: string) => {
    setApplicationsFa(applicationsFa.filter((item) => item !== app));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const candidateData: Partial<BearingProduct> = {
      code: code.trim(),
      category,
      nameFa: nameFa.trim(),
      nameEn: nameEn.trim(),
      descriptionFa,
      descriptionEn,
      inStock,
      featured,
      d: Number(d),
      D: Number(D_dim),
      B: Number(B),
      weightKg: Number(weightKg) || 0,
      crKn: Number(crKn),
      corKn: Number(corKn),
      speedGreaseRpm: Number(speedGreaseRpm),
      speedOilRpm: Number(speedOilRpm) || Number(speedGreaseRpm),
      rMin: rMin ? Number(rMin) : undefined,
      cageMaterialFa,
      cageMaterialEn,
      sealingFa,
      sealingEn,
      calculationFactorE: calculationFactorE !== '' ? Number(calculationFactorE) : undefined,
      calculationFactorY: calculationFactorY !== '' ? Number(calculationFactorY) : undefined,
      calculationFactorY0: calculationFactorY0 !== '' ? Number(calculationFactorY0) : undefined,
      calculationFactorY1: calculationFactorY1 !== '' ? Number(calculationFactorY1) : undefined,
      calculationFactorY2: calculationFactorY2 !== '' ? Number(calculationFactorY2) : undefined,
      calculationFactorF0: calculationFactorF0 !== '' ? Number(calculationFactorF0) : undefined,
      schematicType,
      imageUrl: imageUrl.trim() || '/icon.png',
      images: [imageUrl.trim() || '/icon.png'],
      pdfUrl: pdfUrl.trim() || undefined,
      brands,
      applicationsFa,
      applicationsEn: ['Industrial Machinery'],
      technicalSources: [
        {
          manufacturer: sourceManufacturer || 'Engineering Catalog',
          sourceType: 'official_catalog',
          reference: sourceReference || 'ISO Technical Table',
          verifiedAt: new Date().toISOString().split('T')[0],
        },
      ],
      metaTitleFa: metaTitleFa || undefined,
      metaDescriptionFa: metaDescriptionFa || undefined,
    };

    const result = await onSave(candidateData);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else if (result.success) {
      onClose();
    }
  };

  // Check if factors are complete for the category
  const isRollerFactorsComplete = 
    category === 'roller' 
      ? calculationFactorE !== '' && calculationFactorY !== ''
      : category === 'spherical'
        ? calculationFactorE !== '' && calculationFactorY1 !== '' && calculationFactorY2 !== ''
        : true;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isEditing 
                  ? (isFa ? `ویرایش قطعه مهندسی: ${product?.code}` : `Edit Product: ${product?.code}`)
                  : (isFa ? 'افزودن محصول استاندارد جدید به کاتالوگ' : 'Add New Product to Catalog')}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                ISO 281 / ISO 76 Engineering Standards
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          {[
            { id: 'identity', labelFa: 'هویت و نام', labelEn: 'Identity', icon: FileText },
            { id: 'dimensions', labelFa: 'ابعاد و بارها (ISO)', labelEn: 'Dimensions & Loads', icon: Cpu },
            { id: 'factors', labelFa: 'ضرایب محاسباتی (e, Y)', labelEn: 'Factors & 3D', icon: Calculator },
            { id: 'media', labelFa: 'تصاویر و کاتالوگ PDF', labelEn: 'Media & PDF', icon: ImageIcon },
            { id: 'brands', labelFa: 'برندها و کاربردها', labelEn: 'Brands & Apps', icon: Building2 },
            { id: 'seo', labelFa: 'سئو و متادیتا', labelEn: 'SEO & Sources', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ModalTab)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2
                  ${isActive 
                    ? 'border-indigo-500 bg-slate-900 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isFa ? tab.labelFa : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Banner */}
          {errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-200">
                <AlertTriangle className="w-4 h-4" />
                <span>{isFa ? 'لطفاً خطاهای زیر را اصلاح فرمایید:' : 'Please fix the following validation errors:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pt-1 pr-2">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'شماره فنی بیرینگ (Technical Code)*' : 'Bearing Technical Code*'}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 30205 or 22220 E/C3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'دسته‌بندی مهندسی قطعه*' : 'Engineering Category*'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BearingCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isFa ? c.nameFa : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name Fa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام فارسی کالا*' : 'Persian Title*'}
                  </label>
                  <input
                    type="text"
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    placeholder="مثال: رولبرینگ مخروطی یک ردیفه ۳۰۲۰۵"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Name En */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام انگلیسی کالا*' : 'English Title*'}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Single Row Tapered Roller Bearing 30205"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Description Fa */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'توضیحات و مشخصات کاربردی (فارسی)' : 'Persian Description'}
                </label>
                <textarea
                  value={descriptionFa}
                  onChange={(e) => setDescriptionFa(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                  placeholder="شرح قابلیت تحمل بارهای شعاعی و محوری، جنس قفسه و کاربردهای اصلی..."
                />
              </div>

              {/* Description En */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'توضیحات و مشخصات کاربردی (انگلیسی)' : 'English Description'}
                </label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                  placeholder="High-capacity radial and axial load bearing designed for industrial applications..."
                />
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    {isFa ? 'موجود در انبار تهران (In Stock)' : 'In Stock'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    {isFa ? 'نمایش در بخش قطعات ویژه (Featured)' : 'Featured Item'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: DIMENSIONS & LOADS */}
          {activeTab === 'dimensions' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>
                  {isFa 
                    ? 'استاندارد ابعادی میلی‌متری (ISO 15 / DIN 616) و ظرفیت بارهای مکانیکی بر حسب کیلونیوتن (kN)' 
                    : 'Metric dimensions (mm) and load ratings in kilonewtons (kN) per ISO 15 / ISO 76.'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* d */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'قطر داخلی d (mm)*' : 'Inner Dia d (mm)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={d}
                    onChange={(e) => setD(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* D */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'قطر خارجی D (mm)*' : 'Outer Dia D (mm)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={D_dim}
                    onChange={(e) => setD_dim(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* B */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'عرض/ضخامت B (mm)*' : 'Width B (mm)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={B}
                    onChange={(e) => setB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'وزن خالص (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Cr */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'بار دینامیکی Cr (kN)*' : 'Dynamic Cr (kN)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={crKn}
                    onChange={(e) => setCrKn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* C0r */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'بار استاتیکی C0r (kN)*' : 'Static C0r (kN)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={corKn}
                    onChange={(e) => setCorKn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Grease RPM */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'سرعت گریس (RPM)*' : 'Grease RPM*'}
                  </label>
                  <input
                    type="number"
                    value={speedGreaseRpm}
                    onChange={(e) => setSpeedGreaseRpm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Oil RPM */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'سرعت روغن (RPM)' : 'Oil RPM'}
                  </label>
                  <input
                    type="number"
                    value={speedOilRpm}
                    onChange={(e) => setSpeedOilRpm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Materials & Sealing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'جنس و نوع قفسه (Cage)' : 'Cage Material'}
                  </label>
                  <input
                    type="text"
                    value={cageMaterialFa}
                    onChange={(e) => setCageMaterialFa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نوع آب‌بندی / شیلد (Sealing)' : 'Sealing Type'}
                  </label>
                  <input
                    type="text"
                    value={sealingFa}
                    onChange={(e) => setSealingFa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALCULATION FACTORS & 3D */}
          {activeTab === 'factors' && (
            <div className="space-y-5">
              
              {/* Safety Indicator Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isRollerFactorsComplete
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}>
                {isRollerFactorsComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold block">
                    {isRollerFactorsComplete
                      ? (isFa ? 'وضعیت محاسبه ISO 281: فعال و معتبر' : 'ISO 281 Calculation Status: ACTIVE')
                      : (isFa ? 'وضعیت محاسبه: قفل ایمنی فعال (Safety Locked)' : 'ISO 281 Status: SAFETY LOCKED')}
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-0.5 leading-relaxed">
                    {isFa 
                      ? 'جهت جلوگیری از خطای محاسباتی، مقادیر e و Y باید مستقیماً از کاتالوگ رسمی سازنده وارد شوند.'
                      : 'To prevent engineering calculation errors, factors e & Y must be supplied from verified manufacturer tables.'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                {/* e */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب بار محوری e (Limiting Ratio)' : 'Factor e (Fa/Fr Limit)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorE}
                    onChange={(e) => setCalculationFactorE(e.target.value)}
                    placeholder="e.g. 0.35"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Y */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب تراست Y (Tapered Roller)' : 'Thrust Factor Y'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorY}
                    onChange={(e) => setCalculationFactorY(e.target.value)}
                    placeholder="e.g. 1.70"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Y0 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب تراست استاتیک Y0' : 'Static Thrust Factor Y0'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorY0}
                    onChange={(e) => setCalculationFactorY0(e.target.value)}
                    placeholder="e.g. 0.90"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Y1 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب Y1 (بشکه‌ای Fa/Fr ≤ e)' : 'Spherical Factor Y1'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorY1}
                    onChange={(e) => setCalculationFactorY1(e.target.value)}
                    placeholder="e.g. 1.90"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Y2 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب Y2 (بشکه‌ای Fa/Fr > e)' : 'Spherical Factor Y2'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorY2}
                    onChange={(e) => setCalculationFactorY2(e.target.value)}
                    placeholder="e.g. 2.90"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* f0 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب هندسی f0 (بلبرینگ شیارعمیق)' : 'Ball Bearing Factor f0'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={calculationFactorF0}
                    onChange={(e) => setCalculationFactorF0(e.target.value)}
                    placeholder="e.g. 14.2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schematic Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'مدل هندسی و شماتیک سه‌بعدی (3D CAD Representation)' : '3D Schematic Type'}
                </label>
                <select
                  value={schematicType}
                  onChange={(e) => setSchematicType(e.target.value as BearingSchematicType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {SCHEMATICS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & PDF */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'آدرس تصویر اصلی قطعه (Image URL)' : 'Primary Image URL'}
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/icon.png or https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={imageUrl || '/icon.png'}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.png';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFa ? 'پیش‌نمایش تصویر محصول' : 'Image Preview'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {imageUrl || '/icon.png'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'لینک دانلود کاتالوگ یا دیتاشیت PDF فنی' : 'Technical PDF Datasheet URL'}
                </label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isFa 
                    ? 'در صورت خالی بودن، سامانه به صورت خودکار دیتاشیت استاندارد ISO را با دکمه PDF وب‌سایت تولید می‌کند.' 
                    : 'If empty, the applet will auto-generate technical PDF datasheets dynamically.'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: BRANDS & APPLICATIONS */}
          {activeTab === 'brands' && (
            <div className="space-y-5">
              
              {/* Brands */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'برندهای تأمین‌کننده این شماره فنی' : 'Supported Brands'}
                </label>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {brands.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300 font-mono"
                    >
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBrand(b)}
                        className="hover:text-rose-400 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    placeholder="e.g. TIMKEN, SKF, FAG, NSK"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBrand}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Applications */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'کاربردهای صنعتی اصلی (فارسی)' : 'Industrial Applications'}
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {applicationsFa.map((app) => (
                    <span
                      key={app}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                    >
                      <span>{app}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAppFa(app)}
                        className="hover:text-rose-400 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAppFaInput}
                    onChange={(e) => setNewAppFaInput(e.target.value)}
                    placeholder="مثال: گیربکس‌های صنعتی سنگین، نورد گرم فولاد"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAppFa}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: SEO & SOURCES */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'مرجع و کاتالوگ فنی سازنده (Manufacturer Catalog Reference)' : 'Manufacturer Catalog Reference'}
                </label>
                <input
                  type="text"
                  value={sourceManufacturer}
                  onChange={(e) => setSourceManufacturer(e.target.value)}
                  placeholder="e.g. SKF Rolling Bearings Master Catalog Table 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'عنوان متاتگ سئو (Meta Title)' : 'SEO Meta Title'}
                </label>
                <input
                  type="text"
                  value={metaTitleFa}
                  onChange={(e) => setMetaTitleFa(e.target.value)}
                  placeholder="خرید و مشخصات فنی رولبرینگ ۳۰۲۰۵ | پولاد چرخِش"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'توضیحات متاتگ سئو (Meta Description)' : 'SEO Meta Description'}
                </label>
                <textarea
                  value={metaDescriptionFa}
                  onChange={(e) => setMetaDescriptionFa(e.target.value)}
                  rows={2}
                  placeholder="کاتالوگ ابعاد، ظرفیت بار دینامیکی و استعلام قیمت رولبرینگ ۳۰۲۰۵ اصلی در پولاد چرخِش..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isFa ? 'ذخیره تغییرات قطعه' : 'Save Product Specs'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
