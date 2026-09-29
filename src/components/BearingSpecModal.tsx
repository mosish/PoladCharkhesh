import React, { useState, useEffect } from 'react';
import { BearingProduct, Language } from '../types';
import { translations } from '../data/translations';
import { createWhatsAppInquiryUrl } from '../data/company';
import { useCompanyInfo } from '../services/dataService';
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
  const company = useCompanyInfo();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Escape key listener & Perceived performance loading state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Body scroll lock while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (product) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
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
    baseUrl: company.whatsappUrl,
    productCode: product.code,
    productName: language === 'fa' ? product.nameFa : product.nameEn,
    dimensions: `d=${product.d}mm, D=${product.D}mm, B=${product.B}mm`,
    brands: product.brands,
    language: language === 'fa' ? 'fa' : 'en',
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#030a16a8] backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="bearing-spec-modal-card"
        className="relative w-full max-w-4xl max-h-[92vh] dialog product-float rounded-3xl shadow-2xl overflow-y-auto flex flex-col border border-[#d5eaff50]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-[#142337]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-500/10 text-[#95bee8] border border-blue-500/20">
              <RotateCw className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-mono-spec text-white">
                  {product.code}
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.specModal.brandAuthenticity.split(':')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {language === 'fa' ? product.nameFa : product.nameEn}
              </p>
            </div>
          </div>

          <button
            id="close-spec-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={t.specModal.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 text-slate-200">
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
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#95bee8]" />
                  {t.specModal.dimTitle}
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.innerDiaLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-white">
                      {product.d > 0 ? `${product.d} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.outerDiaLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-white">
                      {product.D > 0 ? `${product.D} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.widthLabel}</span>
                    <span className="text-base sm:text-lg font-black font-mono-spec text-white">
                      {product.B > 0 ? `${product.B} mm` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#95bee8]" />
                  {t.specModal.loadTitle}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.crLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-[#c9e8ff]">
                      {product.crKn > 0 ? `${product.crKn} kN` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.corLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-[#c9e8ff]">
                      {product.corKn > 0 ? `${product.corKn} kN` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.speedGreaseLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-sky-400">
                      {product.speedGreaseRpm > 0 ? `${product.speedGreaseRpm.toLocaleString()} RPM` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                    <span className="block text-[11px] text-slate-400 font-medium">{t.specModal.weightLabel}</span>
                    <span className="text-sm sm:text-base font-black font-mono-spec text-slate-200">
                      {product.weightKg > 0 ? `${product.weightKg} kg` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Materials & Features */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t.specModal.materialTitle}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">{t.specModal.cageLabel}</span>
                <span className="font-semibold text-white">{language === 'fa' ? product.cageMaterialFa : product.cageMaterialEn}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.specModal.sealingLabel}</span>
                <span className="font-semibold text-white">{language === 'fa' ? product.sealingFa : product.sealingEn}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.specModal.clearanceLabel}</span>
                <span className="font-semibold text-white">{product.clearanceOptions.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.specModal.speedGreaseLabel}:</span>
                <span className="font-semibold text-white">{product.speedGreaseRpm ? `${product.speedGreaseRpm.toLocaleString()} RPM` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: PDF Export & WhatsApp / Call Consultation */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              id="export-pdf-datasheet-btn"
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="button flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>{t.specModal.exportingPdf}</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{language === 'fa' ? 'دانلود شد!' : 'Downloaded!'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-[#95bee8]" />
                  <span>{t.specModal.exportPdf}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.specModal.inquireWhatsapp}</span>
              </a>

              <a
                href={company.primaryPhoneTel}
                className="button flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white"
              >
                <PhoneCall className="w-4 h-4 text-[#95bee8]" />
                <span>{t.specModal.directPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BearingSpecModal;
