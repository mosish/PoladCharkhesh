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
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  ShieldCheck,
  Check
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

  // Form States - Tab 1: Identity
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<BearingCategory>('roller');
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);

  // Tab 2: Dimensions & Ratings
  const [d, setD] = useState<number | string>(50);
  const [D_dim, setD_dim] = useState<number | string>(90);
  const [B, setB] = useState<number | string>(21.75);
  const [weightKg, setWeightKg] = useState<number | string>(0.6);
  const [crKn, setCrKn] = useState<number | string>(75.0);
  const [corKn, setCorKn] = useState<number | string>(85.0);
  const [speedGreaseRpm, setSpeedGreaseRpm] = useState<number | string>(4500);
  const [speedOilRpm, setSpeedOilRpm] = useState<number | string>(6000);
  const [thermalSpeedRatingRpm, setThermalSpeedRatingRpm] = useState<number | string>('');
  const [speedReferenceType, setSpeedReferenceType] = useState<'limiting' | 'thermal' | 'both'>('limiting');
  const [rMin, setRMin] = useState<number | string>(1.5);
  const [cageMaterialFa, setCageMaterialFa] = useState('فولاد پرسکاری شده حرارتی');
  const [cageMaterialEn, setCageMaterialEn] = useState('Stamped steel cage');
  const [sealingFa, setSealingFa] = useState('طراحی باز (نیاز به گریس/روغن)');
  const [sealingEn, setSealingEn] = useState('Open design');

  // Tab 3: Calculation Factors & Geometry
  const [calculationFactorE, setCalculationFactorE] = useState<number | string>('');
  const [calculationFactorY, setCalculationFactorY] = useState<number | string>('');
  const [calculationFactorY0, setCalculationFactorY0] = useState<number | string>('');
  const [calculationFactorY1, setCalculationFactorY1] = useState<number | string>('');
  const [calculationFactorY2, setCalculationFactorY2] = useState<number | string>('');
  const [calculationFactorX, setCalculationFactorX] = useState<number | string>('');
  const [calculationFactorF0, setCalculationFactorF0] = useState<number | string>('');
  const [contactAngle, setContactAngle] = useState('');
  const [schematicType, setSchematicType] = useState<BearingSchematicType>('tapered');
  const [clearanceOptions, setClearanceOptions] = useState<string[]>(['Normal', 'C3']);
  const [newClearanceInput, setNewClearanceInput] = useState('');

  // Tab 4: Media & Gallery
  const [imageUrl, setImageUrl] = useState('/icon.png');
  const [images, setImages] = useState<string[]>(['/icon.png']);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // Tab 5: Brands & Tags
  const [brands, setBrands] = useState<string[]>(['SKF', 'FAG', 'TIMKEN']);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [applicationsFa, setApplicationsFa] = useState<string[]>(['صنایع معدنی', 'گیربکس‌های صنعتی']);
  const [newAppFaInput, setNewAppFaInput] = useState('');

  // Tab 6: Technical Source & SEO
  const [sourceManufacturer, setSourceManufacturer] = useState('SKF Rolling Bearings Master Catalog');
  const [sourceReference, setSourceReference] = useState('Official ISO Engineering Data Table');
  const [metaTitleFa, setMetaTitleFa] = useState('');
  const [metaDescriptionFa, setMetaDescriptionFa] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');

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
      setThermalSpeedRatingRpm(product.thermalSpeedRatingRpm ?? '');
      setSpeedReferenceType(product.speedReferenceType || 'limiting');
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
      setCalculationFactorX(product.calculationFactorX ?? '');
      setCalculationFactorF0(product.calculationFactorF0 ?? '');
      setContactAngle(product.contactAngle || '');
      setSchematicType(product.schematicType || 'tapered');
      setClearanceOptions(product.clearanceOptions && product.clearanceOptions.length > 0 ? [...product.clearanceOptions] : ['Normal', 'C3']);

      const initialImgs = product.images && product.images.length > 0 ? [...product.images] : [product.imageUrl || '/icon.png'];
      setImages(initialImgs);
      setImageUrl(product.imageUrl || initialImgs[0] || '/icon.png');
      setPdfUrl(product.pdfUrl || '');

      setBrands(product.brands && product.brands.length > 0 ? [...product.brands] : ['SKF', 'FAG', 'TIMKEN']);
      setApplicationsFa(product.applicationsFa && product.applicationsFa.length > 0 ? [...product.applicationsFa] : ['صنایع عمومی']);

      if (product.technicalSources && product.technicalSources.length > 0) {
        setSourceManufacturer(product.technicalSources[0].manufacturer || '');
        setSourceReference(product.technicalSources[0].reference || '');
      } else {
        setSourceManufacturer('SKF Rolling Bearings Master Catalog');
        setSourceReference('Official ISO Engineering Data Table');
      }

      setMetaTitleFa(product.metaTitleFa || '');
      setMetaDescriptionFa(product.metaDescriptionFa || '');
      setKeywords(product.keywords && product.keywords.length > 0 ? [...product.keywords] : []);
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
      setThermalSpeedRatingRpm('');
      setSpeedReferenceType('limiting');
      setRMin('1.5');
      setCageMaterialFa('فولاد پرسکاری شده حرارتی');
      setCageMaterialEn('Stamped steel cage');
      setSealingFa('طراحی باز (نیاز به گریس/روغن)');
      setSealingEn('Open design');
      setCalculationFactorE('');
      setCalculationFactorY('');
      setCalculationFactorY0('');
      setCalculationFactorY1('');
      setCalculationFactorY2('');
      setCalculationFactorX('');
      setCalculationFactorF0('');
      setContactAngle('');
      setSchematicType('tapered');
      setClearanceOptions(['Normal', 'C3']);
      setImageUrl('/icon.png');
      setImages(['/icon.png']);
      setPdfUrl('');
      setBrands(['SKF', 'FAG', 'TIMKEN']);
      setApplicationsFa(['صنایع سنگین']);
      setSourceManufacturer('SKF Rolling Bearings Master Catalog');
      setSourceReference('Official ISO Engineering Data Table');
      setMetaTitleFa('');
      setMetaDescriptionFa('');
      setKeywords([]);
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

  const handleAddClearance = () => {
    if (newClearanceInput.trim() && !clearanceOptions.includes(newClearanceInput.trim().toUpperCase())) {
      setClearanceOptions([...clearanceOptions, newClearanceInput.trim().toUpperCase()]);
      setNewClearanceInput('');
    }
  };

  const handleRemoveClearance = (c: string) => {
    setClearanceOptions(clearanceOptions.filter((item) => item !== c));
  };

  const handleAddImage = () => {
    const trimmed = newImageUrlInput.trim();
    if (trimmed && !images.includes(trimmed)) {
      const updated = [...images, trimmed];
      setImages(updated);
      if (!imageUrl || imageUrl === '/icon.png') {
        setImageUrl(trimmed);
      }
      setNewImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (images[index] === imageUrl) {
      setImageUrl(updated[0] || '/icon.png');
    }
  };

  const handleSetPrimaryImage = (url: string) => {
    setImageUrl(url);
    const reordered = [url, ...images.filter((img) => img !== url)];
    setImages(reordered);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setImages(reordered);
  };

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((item) => item !== kw));
  };

  // Real-time client-side engineering physical warnings
  const dVal = Number(d);
  const DVal = Number(D_dim);
  const BVal = Number(B);
  const isPhysicalImpossibility = !isNaN(dVal) && !isNaN(DVal) && dVal > 0 && DVal > 0 && DVal <= dVal;
  const hasNegativeDimensions = (dVal < 0) || (DVal < 0) || (BVal < 0);
  const isCatalogVerified = Boolean(sourceManufacturer && sourceManufacturer.trim().length > 3);

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
      thermalSpeedRatingRpm: thermalSpeedRatingRpm !== '' ? Number(thermalSpeedRatingRpm) : undefined,
      speedReferenceType,
      rMin: rMin ? Number(rMin) : undefined,
      cageMaterialFa,
      cageMaterialEn,
      sealingFa,
      sealingEn,
      clearanceOptions,
      contactAngle: contactAngle.trim() || undefined,
      calculationFactorE: calculationFactorE !== '' ? Number(calculationFactorE) : undefined,
      calculationFactorY: calculationFactorY !== '' ? Number(calculationFactorY) : undefined,
      calculationFactorY0: calculationFactorY0 !== '' ? Number(calculationFactorY0) : undefined,
      calculationFactorY1: calculationFactorY1 !== '' ? Number(calculationFactorY1) : undefined,
      calculationFactorY2: calculationFactorY2 !== '' ? Number(calculationFactorY2) : undefined,
      calculationFactorX: calculationFactorX !== '' ? Number(calculationFactorX) : undefined,
      calculationFactorF0: calculationFactorF0 !== '' ? Number(calculationFactorF0) : undefined,
      schematicType,
      imageUrl: imageUrl.trim() || (images[0] || '/icon.png'),
      images: images.length > 0 ? images : [imageUrl.trim() || '/icon.png'],
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
      keywords: keywords.length > 0 ? keywords : undefined,
    };

    const result = await onSave(candidateData);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else if (result.success) {
      onClose();
    }
  };

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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isEditing 
                    ? (isFa ? `ویرایش قطعه مهندسی: ${product?.code}` : `Edit Product: ${product?.code}`)
                    : (isFa ? 'افزودن محصول استاندارد جدید به کاتالوگ' : 'Add New Product to Catalog')}
                </h2>
                {isCatalogVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{isFa ? 'اصالت کاتالوگ مهندسی تأییدشده' : 'Catalog Verified'}</span>
                  </span>
                )}
              </div>
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
            { id: 'factors', labelFa: 'ضرایب محاسباتی و لقی', labelEn: 'Factors & Clearance', icon: Calculator },
            { id: 'media', labelFa: 'گالری و کاتالوگ PDF', labelEn: 'Media & PDF', icon: ImageIcon },
            { id: 'brands', labelFa: 'برندها و کاربردها', labelEn: 'Brands & Apps', icon: Building2 },
            { id: 'seo', labelFa: 'سئو و مراجع فنی', labelEn: 'SEO & Sources', icon: Globe },
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
          
          {/* Engineering Physical Impossibility Warning Alert */}
          {isPhysicalImpossibility && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold block">
                  {isFa ? 'خطای فیزیکی در ابعاد برینگ (Physical Impossibility):' : 'Physical Impossibility Warning:'}
                </span>
                <span>
                  {isFa 
                    ? `قطر خارجی D (${D_dim}mm) نمی‌تواند کوچکتر یا مساوی قطر داخلی d (${d}mm) باشد.` 
                    : `Outer diameter D (${D_dim}mm) must be strictly greater than inner bore d (${d}mm).`}
                </span>
              </div>
            </div>
          )}

          {hasNegativeDimensions && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                {isFa 
                  ? 'ابعاد فیزیکی قطعه نمی‌توانند مقادیر منفی باشند.' 
                  : 'Physical dimensions cannot be negative values.'}
              </span>
            </div>
          )}

          {/* Server Error Banner */}
          {errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{isFa ? 'خطا در ثبت مشخصات محصول:' : 'Validation Errors:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: IDENTITY & CLASSIFICATION */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'کد فنی استاندارد (Designation Code)*' : 'Standard Code*'}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 30205 J2/Q, 22218 EK"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'دسته‌بندی فنی بیرینگ (Category)*' : 'Category*'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BearingCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isFa ? c.nameFa : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name Fa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'عنوان فارسی کالا*' : 'Persian Title*'}
                  </label>
                  <input
                    type="text"
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    placeholder="رولبرینگ مخروطی ۳۰۲۰۵ اصلی"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Name En */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'عنوان انگلیسی کالا*' : 'English Title*'}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Tapered Roller Bearing 30205"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Status & Featured Flags */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-semibold">
                    {isFa ? 'وضعیت موجودی در انبار (In Stock)' : 'In Stock'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{isFa ? 'کالای شاخص / ویژه (Featured Item)' : 'Featured Item'}</span>
                  </span>
                </label>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'توضیحات و مشخصات کاربردی (فارسی)' : 'Description (Fa)'}
                  </label>
                  <textarea
                    value={descriptionFa}
                    onChange={(e) => setDescriptionFa(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="شرح شرایط کاری، تلرانس‌های انطباقی، روانکاری..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'توضیحات فنی (انگلیسی)' : 'Description (En)'}
                  </label>
                  <textarea
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Operating conditions, load capacities, cage design..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIMENSIONS & RATINGS (ISO 281) */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300">
                {isFa 
                  ? 'ابعاد هندسی برحسب میلیمتر (mm) و ظرفیت‌های بارگذاری برحسب کیلونیوتن (kN) مطابق با استاندارد ISO 281.' 
                  : 'Physical dimensions in mm and load ratings in kN according to ISO 281 standards.'}
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
                    {isFa ? 'سرعت مجاز گریس (RPM)*' : 'Grease RPM*'}
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
                    {isFa ? 'سرعت مجاز روغن (RPM)' : 'Oil RPM'}
                  </label>
                  <input
                    type="number"
                    value={speedOilRpm}
                    onChange={(e) => setSpeedOilRpm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extended Speeds & Reference Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'سرعت مرجع حرارتی (Thermal RPM)' : 'Thermal Speed Rating (RPM)'}
                  </label>
                  <input
                    type="number"
                    value={thermalSpeedRatingRpm}
                    onChange={(e) => setThermalSpeedRatingRpm(e.target.value)}
                    placeholder="e.g. 5200"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نوع مرجع سرعت (Speed Reference)' : 'Speed Reference Type'}
                  </label>
                  <select
                    value={speedReferenceType}
                    onChange={(e) => setSpeedReferenceType(e.target.value as 'limiting' | 'thermal' | 'both')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="limiting">{isFa ? 'سرعت حد (Limiting Speed)' : 'Limiting Speed'}</option>
                    <option value="thermal">{isFa ? 'سرعت مرجع حرارتی (Thermal)' : 'Thermal Reference'}</option>
                    <option value="both">{isFa ? 'هر دو (Both Limiting & Thermal)' : 'Both'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'شعاع پخ r_min (mm)' : 'Chamfer r_min (mm)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rMin}
                    onChange={(e) => setRMin(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Materials & Sealing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'جنس و نوع قفسه (Cage Material)' : 'Cage Material'}
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

          {/* TAB 3: CALCULATION FACTORS & GEOMETRY */}
          {activeTab === 'factors' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                {isFa 
                  ? 'ضرایب محاسباتی استاندارد ISO 281 برای تحلیل بار معادل دینامیکی P = X*Fr + Y*Fa و طول عمر مفید L10h.' 
                  : 'ISO 281 calculation factors for equivalent dynamic bearing load and rating life L10h.'}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* e */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب بار حد e (Fa/Fr)' : 'Factor e'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorE}
                    onChange={(e) => setCalculationFactorE(e.target.value)}
                    placeholder="e.g. 0.37"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Y */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب تراست Y (مخروطی)' : 'Thrust Factor Y'}
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
                    {isFa ? 'ضریب استاتیک Y0' : 'Static Factor Y0'}
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

                {/* Factor X */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب شعاعی X' : 'Radial Factor X'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculationFactorX}
                    onChange={(e) => setCalculationFactorX(e.target.value)}
                    placeholder="e.g. 0.40"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Y1 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ضریب Y1 (بشکه‌ای Fa/Fr ≤ e)' : 'Spherical Y1'}
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
                    {isFa ? 'ضریب Y2 (بشکه‌ای Fa/Fr > e)' : 'Spherical Y2'}
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
                    {isFa ? 'ضریب هندسی f0 (شیارعمیق)' : 'Factor f0'}
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

                {/* Contact Angle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'زاویه تماس (Contact Angle)' : 'Contact Angle'}
                  </label>
                  <input
                    type="text"
                    value={contactAngle}
                    onChange={(e) => setContactAngle(e.target.value)}
                    placeholder="e.g. 40°, 15°"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clearance Options */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'کلاس‌های لقی داخلی شعاعی (Radial Internal Clearance)' : 'Internal Clearance Classes'}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {clearanceOptions.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-mono"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClearance(c)}
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
                    value={newClearanceInput}
                    onChange={(e) => setNewClearanceInput(e.target.value)}
                    placeholder="e.g. Normal, C2, C3, C4, C5"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddClearance}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
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

          {/* TAB 4: MEDIA & GALLERY */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              
              {/* Primary Image & Gallery List */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'گالری تصاویر قطعه (تصویر اول به عنوان تصویر شاخص کاتالوگ نمایش داده می‌شود)' : 'Product Image Gallery'}
                </label>

                {/* Images Preview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {images.map((img, idx) => {
                    const isPrimary = img === imageUrl;
                    return (
                      <div 
                        key={idx} 
                        className={`relative group rounded-2xl bg-slate-950 border p-2 flex flex-col items-center justify-between transition-all ${isPrimary ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800'}`}
                      >
                        <div className="w-full h-24 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden mb-2">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/icon.png';
                            }}
                          />
                        </div>

                        {/* Top Badge */}
                        {isPrimary && (
                          <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                            {isFa ? 'شاخص' : 'Primary'}
                          </span>
                        )}

                        {/* Actions */}
                        <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'down')}
                              disabled={idx === images.length - 1}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img)}
                                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 text-[10px] text-indigo-300 font-bold"
                              >
                                {isFa ? 'اصلی' : 'Set Main'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new image URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrlInput}
                    onChange={(e) => setNewImageUrlInput(e.target.value)}
                    placeholder="/icon.png or https://example.com/bearing.jpg"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isFa ? 'افزودن تصویر' : 'Add Image'}</span>
                  </button>
                </div>
              </div>

              {/* PDF Datasheet */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'لینک دانلود کاتالوگ یا دیتاشیت PDF فنی سازنده' : 'Technical PDF Datasheet URL'}
                </label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://catalog.example.com/datasheet.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isFa 
                    ? 'در صورت خالی بودن، سامانه کاتالوگ مهندسی ISO را به همراه محاسبات L10h با دکمه PDF وب‌سایت تولید خواهد کرد.' 
                    : 'If empty, the applet automatically generates an ISO technical PDF datasheet.'}
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
                  {isFa ? 'برندهای بین‌المللی تأمین‌کننده این شماره فنی' : 'Supported Brands'}
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
                    placeholder="e.g. TIMKEN, SKF, FAG, NSK, NTN, KOYO"
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
                  {isFa ? 'کاربردهای صنعتی و صنایع هدف (فارسی)' : 'Industrial Applications'}
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
                    placeholder="مثال: خطوط نورد گرم فولاد، توربین‌های بادی، پمپ‌های پتروشیمی"
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

          {/* TAB 6: SEO & TECHNICAL SOURCES */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              
              {/* Provenance Badge Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCatalogVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isCatalogVerified 
                        ? (isFa ? 'تأییدیه اصالت کاتالوگ مهندسی معتبر' : 'Verified Engineering Provenance')
                        : (isFa ? 'وضعیت راستی‌آزمایی کاتالوگ' : 'Provenance Status')}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {sourceManufacturer || (isFa ? 'بدون مرجع رسمی ثبت شده' : 'No manufacturer catalog recorded')}
                    </span>
                  </div>
                </div>
                {isCatalogVerified && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{isFa ? 'تأیید' : 'Verified'}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'مرجع و کاتالوگ رسمی سازنده (Manufacturer Catalog Reference)' : 'Manufacturer Catalog Reference'}
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
                  {isFa ? 'عنوان متاتگ سئو (SEO Meta Title)' : 'SEO Meta Title'}
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
                  {isFa ? 'توضیحات متاتگ سئو (SEO Meta Description)' : 'SEO Meta Description'}
                </label>
                <textarea
                  value={metaDescriptionFa}
                  onChange={(e) => setMetaDescriptionFa(e.target.value)}
                  rows={2}
                  placeholder="کاتالوگ ابعاد، ظرفیت بار دینامیکی و استعلام اصالت رولبرینگ ۳۰۲۰۵ اصلی در پولاد چرخِش..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFa ? 'کلمات کلیدی جستجو و سئو (Keywords)' : 'SEO Keywords'}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-mono"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
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
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    placeholder="e.g. بلبرینگ مخروطی, SKF 30205, بیرینگ صنایع فولاد"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
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
              disabled={isPhysicalImpossibility || hasNegativeDimensions}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all"
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
