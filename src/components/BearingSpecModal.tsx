import React, { useState, useEffect } from 'react';
import { BearingProduct, Language } from '../types';
import { translations } from '../data/translations';
import { COMPANY_INFO, createWhatsAppInquiryUrl } from '../data/company';
import { PartMediaSlider } from './PartMediaSlider';
import { exportProductSpecPdf } from '../utils/pdfExport';
import { BearingSpecModalSkeleton } from './Skeletons';
import { 
  X, 
  Layers, 
  Activity, 
  RotateCw, 
  CheckCircle2,
  FileDown,
  Loader2,
  MessageCircle,
  PhoneCall
} from 'lucide-react';

interface BearingSpecModalProps {
  product: BearingProduct | null;
  language: Language;
  onClose: () => void;
}

export const BearingSpecModal: React.FC<BearingSpecModalProps> = ({
  product,
  language,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Perceived performance loading state when opening or switching product
  useEffect(() => {
    if (product) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [product?.id]);

  if (!product) return null;

  if (isLoading) {
    return <BearingSpecModalSkeleton language={language} onClose={onClose} />;
  }

  const t = translations[language];


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

  const whatsappUrl = createWhatsAppInquiryUrl({
    productCode: product.code,
    productName: language === 'fa' ? product.nameFa : product.nameEn,
    dimensions: `d=${product.d}mm, D=${product.D}mm, B=${product.B}mm`,
    brands: product.brands,
    language: language === 'fa' ? 'fa' : 'en',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="bearing-spec-modal-card"
        className="relative w-full max-w-4xl max-h-[92vh] glass-card rounded-3xl shadow-2xl overflow-y-auto bg-white/95 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/15">
              <RotateCw className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-mono-spec text-slate-900">
                  {product.code}
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.specModal.brandAuthenticity.split(':')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {language === 'fa' ? product.nameFa : product.nameEn}
              </p>
            </div>
          </div>

          <button
            id="close-spec-modal-btn"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-full transition-colors cursor-pointer"
            title={t.specModal.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Top Grid: CAD Schematic & Key Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 flex flex-col justify-center">
              <PartMediaSlider 
                product={product} 
                language={language} 
                className="h-56 sm:h-64" 
                showLabels={true} 
              />
              <div className="mt-2 text-center text-xs text-slate-400 font-mono-spec">
                {t.specModal.standardCode}
              </div>
            </div>

            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#232c86]" />
                  {t.specModal.dimTitle}
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.innerDiaLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-slate-900">
                      {product.d > 0 ? `${product.d} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.outerDiaLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-slate-900">
                      {product.D > 0 ? `${product.D} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.widthLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-slate-900">
                      {product.B > 0 ? `${product.B} mm` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#232c86]" />
                  {t.specModal.loadTitle}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.crLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-[#232c86]">
                      {product.crKn > 0 ? `${product.crKn} kN` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.corLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-[#232c86]">
                      {product.corKn > 0 ? `${product.corKn} kN` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.speedGreaseLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-sky-600">
                      {product.speedGreaseRpm > 0 ? `${product.speedGreaseRpm.toLocaleString()} RPM` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
                    <span className="block text-[11px] text-slate-500 font-medium">{t.specModal.weightLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-slate-700">
                      {product.weightKg > 0 ? `${product.weightKg} kg` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Materials & Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">
                {t.specModal.materialTitle}
              </h5>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#232c86] mt-1.5 flex-shrink-0" />
                  <span><strong>{t.specModal.cageLabel}</strong> {language === 'fa' ? product.cageMaterialFa : product.cageMaterialEn}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#232c86] mt-1.5 flex-shrink-0" />
                  <span><strong>{t.specModal.sealingLabel}</strong> {language === 'fa' ? product.sealingFa : product.sealingEn}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#232c86] mt-1.5 flex-shrink-0" />
                  <span><strong>{t.specModal.clearanceLabel}</strong> {product.clearanceOptions.join(' , ')}</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-100/60 rounded-2xl border border-white/80 shadow-sm">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">
                {t.specModal.brandsTitle}
              </h5>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.brands.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl glass-pill text-slate-800 font-mono-spec"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                {t.specModal.brandsNote}
              </p>
            </div>
          </div>

          {/* Applications list */}
          <div>
            <h5 className="text-sm font-bold text-slate-900 mb-2">
              {t.specModal.applicationsTitle}
            </h5>
            <div className="flex flex-wrap gap-2">
              {(language === 'fa' ? product.applicationsFa : product.applicationsEn).map((app, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-xs rounded-full glass-pill text-[#232c86]"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="sticky bottom-0 z-20 px-5 sm:px-6 py-4 bg-slate-50/95 backdrop-blur-md border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          {/* Main Formatted PDF Export Button */}
          <button
            id="modal-download-pdf-btn"
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#232c86] hover:bg-[#1a2166] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60 flex-1 sm:flex-initial"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>{isExporting ? t.specModal.exportingPdf : t.specModal.exportPdf}</span>
          </button>

          {/* WhatsApp and Phone Inquiry Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              id="spec-modal-whatsapp-link"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex-1 sm:flex-initial"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.specModal.inquireWhatsapp}</span>
            </a>

            <a
              id="spec-modal-phone-link"
              href={COMPANY_INFO.primaryPhoneTel}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-200/90 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition-all"
              title={t.specModal.directPhone}
            >
              <PhoneCall className="w-4 h-4 text-[#232c86]" />
              <span className="hidden md:inline font-mono-spec">{language === 'fa' ? COMPANY_INFO.primaryPhoneDisplayFa : COMPANY_INFO.primaryPhoneDisplayEn}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};


