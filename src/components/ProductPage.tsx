import React, { useState } from 'react';
import { 
  BearingProduct, 
  Language 
} from '../types';
import { translations } from '../data/translations';
import { createWhatsAppInquiryUrl } from '../data/company';
import { useCompanyInfo } from '../services/dataService';
import { PartMediaSlider } from './PartMediaSlider';
import { exportProductSpecPdf } from '../utils/pdfExport';
import { Breadcrumbs } from './Breadcrumbs';
import { getProductSlug, getRelatedProducts } from '../utils/productSlug';
import { 
  CheckCircle2, 
  Layers, 
  FileDown, 
  Loader2, 
  MessageCircle, 
  PhoneCall, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  Boxes,
  Calculator
} from 'lucide-react';

interface ProductPageProps {
  product: BearingProduct;
  allProducts: BearingProduct[];
  language: Language;
  onNavigateHome: () => void;
  onNavigateCatalog: (category?: string) => void;
  onNavigateProduct: (slug: string) => void;
  onNavigateCalculator?: (code?: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  language,
  onNavigateHome,
  onNavigateCatalog,
  onNavigateProduct,
  onNavigateCalculator,
}) => {
  const company = useCompanyInfo();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const t = translations[language];
  const isRtl = language === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;

  const categoryName = t.catalog.categories[product.category] || product.category;

  const breadcrumbItems = [
    { label: isRtl ? 'صفحه اصلی' : 'Home', onClick: onNavigateHome },
    { label: isRtl ? 'کاتالوگ قطعات صنعتی' : 'Product Catalog', onClick: () => onNavigateCatalog('all') },
    { label: categoryName, onClick: () => onNavigateCatalog(product.category) },
    { label: product.code, isCurrent: true },
  ];

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);
      await exportProductSpecPdf(product, language);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export PDF datasheet:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const whatsappInquiryUrl = createWhatsAppInquiryUrl({
    baseUrl: company.whatsappUrl,
    productCode: product.code,
    productName: isRtl ? product.nameFa : product.nameEn,
    dimensions: `d=${product.d}mm, D=${product.D}mm, B=${product.B}mm`,
    brands: product.brands,
    language: language,
  });

  const relatedProducts = getRelatedProducts(product, allProducts, 3);

  return (
    <article className="py-8 sm:py-12 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 text-slate-100">
      
      {/* 1. TOP BREADCRUMBS & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
        <Breadcrumbs items={breadcrumbItems} language={language} />
        
        <button
          type="button"
          onClick={() => onNavigateCatalog('all')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{isRtl ? 'بازگشت به فهرست کاتالوگ' : 'Back to Catalog List'}</span>
        </button>
      </div>

      {/* 2. HERO / IDENTITY & MEDIA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Visual & CAD Visualization */}
        <div className="lg:col-span-6 space-y-4">
          <div className="panel p-4 sm:p-6 rounded-3xl relative overflow-hidden">
            <PartMediaSlider 
              product={product} 
              language={language} 
              className="h-72 sm:h-96" 
              showLabels={true} 
            />
          </div>

          {/* Quick ISO Dimension Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 panel rounded-2xl">
              <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.innerDiaLabel}</span>
              <span className="text-base sm:text-lg font-black text-white font-mono-spec">
                Ø {product.d > 0 ? `${product.d} mm` : '—'}
              </span>
            </div>
            <div className="p-3.5 panel rounded-2xl">
              <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.outerDiaLabel}</span>
              <span className="text-base sm:text-lg font-black text-white font-mono-spec">
                Ø {product.D > 0 ? `${product.D} mm` : '—'}
              </span>
            </div>
            <div className="p-3.5 panel rounded-2xl">
              <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.widthLabel}</span>
              <span className="text-base sm:text-lg font-black text-white font-mono-spec">
                {product.B > 0 ? `${product.B} mm` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Identity, Status, Brands & Fast CTAs */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Title & Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 text-[#c9e8ff] border border-white/15 font-mono-spec">
                {categoryName}
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isRtl ? 'ضمانت ۱۰۰٪ اصالت و اورجینال' : '100% Guaranteed Authentic'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono-spec tracking-tight">
              {product.code}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              {isRtl ? product.nameFa : product.nameEn}
            </p>
          </div>

          {/* Description */}
          <div className="p-4.5 panel rounded-2xl text-sm text-slate-300 leading-relaxed">
            {isRtl ? product.descriptionFa : product.descriptionEn}
          </div>

          {/* Available / Supplied Brands */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {isRtl ? 'برندهای قابل تأمین و استعلام فنی:' : 'Available / Supplied Brands:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {product.brands.map((brand) => (
                <span
                  key={brand}
                  className="px-3 py-1.5 bg-white/10 text-slate-200 font-bold text-xs rounded-xl border border-white/15 shadow-sm font-mono-spec"
                >
                  {brand}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {isRtl
                ? '* استعلام موجودی دقیق انبار تهران و پالت‌های وارداتی از طریق واحد فنی انجام می‌پذیرد.'
                : '* Exact stock availability and import batch confirmation is managed directly by technical sales.'}
            </p>
          </div>

          {/* Direct Technical Action Box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#162744] to-[#0c1a2e] border border-white/15 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {isRtl ? 'مرکز مشاوره و استعلام مستقیم' : 'Technical Consultation & Inquiry Desk'}
              </span>
              <span className="text-xs text-blue-200 font-mono-spec font-medium">
                {isRtl ? company.workingHoursFa.split('|')[0] : company.workingHoursShortEn}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Primary Call */}
              {company.phoneEnabled !== false && (
                <a
                  href={company.primaryPhoneTel}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-md font-mono-spec cursor-pointer"
                  title="تماس مستقیم با واحد فنی"
                >
                  <PhoneCall className="w-4 h-4 text-slate-950" />
                  <span>{isRtl ? `تماس: ${company.primaryPhoneDisplayFa}` : `Call: ${company.primaryPhoneDisplayEn}`}</span>
                </a>
              )}

              {/* Fast WhatsApp Inquiry */}
              {company.whatsappEnabled !== false && (
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>{isRtl ? 'استعلام در واتس‌اپ' : 'WhatsApp Inquiry'}</span>
                </a>
              )}
            </div>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-2xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{t.specModal.exportingPdf}</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? 'دیتاشیت PDF با موفقیت دانلود شد' : 'PDF Datasheet Downloaded Successfully'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-amber-300" />
                  <span>{isRtl ? 'دانلود دیتاشیت فنی رسمی (PDF Datasheet)' : 'Download Official PDF Datasheet'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 3. COMPREHENSIVE TECHNICAL SPECIFICATIONS TABLE */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#95bee8]" />
            <span>{isRtl ? 'مشخصات کامل مهندسی و ابعادی استاندارد' : 'Complete Technical & ISO Boundary Specifications'}</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono-spec font-semibold">
            {t.specModal.standardCode}
          </span>
        </div>

        <div className="panel rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <tbody className="divide-y divide-white/10">
                
                {/* Row 1: Dimensions */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5 w-1/3">
                    {isRtl ? 'ابعاد اصلی قطعه (d × D × B)' : 'Principal Boundary Dimensions (d × D × B)'}
                  </th>
                  <td className="px-6 py-4 font-mono-spec font-bold text-white">
                    {product.d} × {product.D} × {product.B} mm
                  </td>
                </tr>

                {/* Row 2: Weight */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'وزن خالص (Mass)' : 'Net Mass / Weight'}
                  </th>
                  <td className="px-6 py-4 font-mono-spec text-slate-300">
                    {product.weightKg > 0 ? `${product.weightKg} kg` : '—'}
                  </td>
                </tr>

                {/* Row 3: Dynamic Load Rating */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'ظرفیت بار دینامیکی پایه (Cr)' : 'Basic Dynamic Load Rating (Cr)'}
                  </th>
                  <td className="px-6 py-4 font-mono-spec font-semibold text-[#c9e8ff]">
                    {product.crKn > 0 ? `${product.crKn} kN` : '—'}
                  </td>
                </tr>

                {/* Row 4: Static Load Rating */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'ظرفیت بار استاتیکی پایه (Cor)' : 'Basic Static Load Rating (Cor)'}
                  </th>
                  <td className="px-6 py-4 font-mono-spec font-semibold text-slate-300">
                    {product.corKn > 0 ? `${product.corKn} kN` : '—'}
                  </td>
                </tr>

                {/* Row 5: Speed Ratings */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'سرعت حد مجاز گریس و روغن (Limiting Speeds)' : 'Limiting Speed Ratings (Grease / Oil)'}
                  </th>
                  <td className="px-6 py-4 font-mono-spec">
                    <span className="text-emerald-400 font-semibold">{product.speedGreaseRpm} RPM (Grease)</span>
                    <span className="text-slate-500 mx-2">|</span>
                    <span className="text-sky-400 font-semibold">{product.speedOilRpm} RPM (Oil)</span>
                  </td>
                </tr>

                {/* Row 6: Thermal Speed Reference (if certified) */}
                {product.thermalSpeedRatingRpm && (
                  <tr className="hover:bg-white/5 transition-colors bg-amber-500/10">
                    <th scope="row" className="px-6 py-4 font-bold text-white bg-amber-500/15">
                      {isRtl ? 'سرعت مرجع حرارتی معتبر (ISO 15312 Reference Speed)' : 'Certified Thermal Reference Speed (ISO 15312)'}
                    </th>
                    <td className="px-6 py-4 font-mono-spec font-bold text-amber-300">
                      {product.thermalSpeedRatingRpm} RPM
                    </td>
                  </tr>
                )}

                {/* Row 7: Cage Material */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'ساختار و جنس قفسه (Cage Material)' : 'Cage Design & Material'}
                  </th>
                  <td className="px-6 py-4 text-slate-300">
                    {isRtl ? product.cageMaterialFa : product.cageMaterialEn}
                  </td>
                </tr>

                {/* Row 8: Sealing */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'آب‌بند و حفاظ گردوغبار (Sealing / Shield)' : 'Sealing & Shielding Configuration'}
                  </th>
                  <td className="px-6 py-4 text-slate-300">
                    {isRtl ? product.sealingFa : product.sealingEn}
                  </td>
                </tr>

                {/* Row 9: Radial Clearance Options */}
                <tr className="hover:bg-white/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                    {isRtl ? 'کلاس‌های لقی شعاعی داخلی (Internal Clearance)' : 'Radial Internal Clearance Options'}
                  </th>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {product.clearanceOptions.map((opt) => (
                        <span
                          key={opt}
                          className="px-2.5 py-0.5 bg-white/10 text-slate-200 rounded-md font-mono-spec text-xs font-semibold border border-white/10"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>

                {/* Row 10: Technical Catalog Citation */}
                {product.technicalSources && product.technicalSources.length > 0 && (
                  <tr className="hover:bg-white/5 transition-colors">
                    <th scope="row" className="px-6 py-4 font-bold text-white bg-white/5">
                      {isRtl ? 'مرجع استاندارد و کاتالوگ کارخانه سازنده' : 'Verified Engineering Catalog Source'}
                    </th>
                    <td className="px-6 py-4 text-xs font-mono-spec text-slate-400">
                      {product.technicalSources[0].manufacturer} — {product.technicalSources[0].reference}
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {isRtl ? `تاریخ تطابق فنی: ${product.technicalSources[0].verifiedAt}` : `Verified: ${product.technicalSources[0].verifiedAt}`}
                      </span>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. APPLICATIONS SECTION */}
      {product.applicationsFa && product.applicationsFa.length > 0 && (
        <section className="space-y-4 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#95bee8]" />
            <span>{isRtl ? 'کاربردهای پیشنهادی در صنایع سنگین و خطوط تولید' : 'Industrial Applications & Operating Environments'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {(isRtl ? product.applicationsFa : product.applicationsEn).map((app, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl panel flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-[#95bee8] mt-2 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-200 leading-relaxed">
                  {app}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. ENGINEERING TOOLS JUMP BANNER */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#101e33] to-[#1c3254] border border-white/15 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono-spec">
            <Calculator className="w-3.5 h-3.5" />
            <span>ISO 281 / ISO 15312 TOOLS</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            {isRtl ? `محاسبه عمر کاری و رفتار حرارتی ${product.code}` : `Calculate Bearing Lifetime (L10h) for ${product.code}`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {isRtl
              ? 'از ابزارهای تعاملی پولاد چرخش جهت تخمین دقیق طول عمر بلبرینگ، دمای تعادل روغن و بازه‌های روانکاری مجدد استفاده نمایید.'
              : 'Utilize our interactive engineering tools to evaluate operating fatigue life (L10h), thermal equilibrium, and regreasing intervals.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onNavigateCalculator) {
                onNavigateCalculator(product.code);
              } else {
                const calcEl = document.getElementById('calculator');
                if (calcEl) calcEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>{isRtl ? 'محاسبه‌گر آنلاین عمر بلبرینگ' : 'Open Life Calculator'}</span>
            <ForwardIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 6. DETERMINISTIC RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Boxes className="w-5 h-5 text-[#95bee8]" />
              <span>{isRtl ? 'قطعات و سایزهای مرتبط در همین خانواده' : 'Related Components in Same Series & Category'}</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateCatalog(product.category)}
              className="text-xs font-bold text-[#95bee8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isRtl ? 'مشاهده همه' : 'View All'}</span>
              <ForwardIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => {
              const relSlug = getProductSlug(rel);
              return (
                <div
                  key={rel.id}
                  onClick={() => onNavigateProduct(relSlug)}
                  className="panel p-4 rounded-2xl hover:border-[#95bee8]/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#c9e8ff] bg-white/10 px-2 py-0.5 rounded font-mono-spec border border-white/10">
                        {rel.code}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono-spec">
                        {rel.d}×{rel.D}×{rel.B} mm
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-[#95bee8] transition-colors">
                      {isRtl ? rel.nameFa : rel.nameEn}
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {isRtl ? rel.descriptionFa : rel.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#95bee8] font-bold">
                    <span>{isRtl ? 'مشاهده مشخصات فنی' : 'View Specifications'}</span>
                    <ForwardIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. CONTACT & INQUIRY FOOTER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl panel text-center space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-white">
          {isRtl ? `نیاز به استعلام قیمت، پسوند اختصاصی یا پیش‌فاکتور رسمی برای ${product.code} دارید؟` : `Need Official Inquiries, Specific Suffixes, or Proforma for ${product.code}?`}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          {isRtl
            ? 'کارشناسان بازرگانی و مهندسی پولاد چرخِش آماده ارائه مشاوره فنی رایگان، تأیید اصالت کالا و صدور پیش‌فاکتور شرکتی می‌باشند.'
            : 'Polad Charkhesh commercial and engineering experts provide direct authenticity validation and corporate technical proformas.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={company.primaryPhoneTel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-bold rounded-2xl transition-all shadow-md font-mono-spec cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isRtl ? `تماس با کارشناس: ${company.primaryPhoneDisplayFa}` : `Direct Call: ${company.primaryPhoneDisplayEn}`}</span>
          </a>

          <a
            href={company.landlinePhoneTel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-2xl border border-white/15 transition-all shadow-sm font-mono-spec cursor-pointer"
          >
            <span>{isRtl ? `دفتر مرکزی: ${company.landlinePhoneDisplayFa}` : `Office: ${company.landlinePhoneDisplayEn}`}</span>
          </a>

          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl transition-all shadow-md cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isRtl ? 'استعلام در واتس‌اپ' : 'WhatsApp Inquiry'}</span>
          </a>
        </div>
      </div>

    </article>
  );
};
export default ProductPage;
