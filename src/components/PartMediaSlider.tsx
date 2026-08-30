import React, { useState } from 'react';
import { BearingProduct, Language } from '../types';
import { BearingSchematic } from './BearingSchematic';
import { translations } from '../data/translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Camera,
  CheckCircle2
} from 'lucide-react';

interface PartMediaSliderProps {
  product: BearingProduct;
  language: Language;
  className?: string;
  showLabels?: boolean;
  onImageClick?: () => void;
}

export const PartMediaSlider: React.FC<PartMediaSliderProps> = ({
  product,
  language,
  className = 'h-36 sm:h-40',
  showLabels = false,
  onImageClick,
}) => {
  const [activeSlide, setActiveSlide] = useState<number>(0); // 0: Schematic CAD, 1: Real Photo
  const t = translations[language];

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  };

  const handleSelectSlide = (e: React.MouseEvent, slideIndex: number) => {
    e.stopPropagation();
    setActiveSlide(slideIndex);
  };

  return (
    <div 
      className={`relative w-full ${className} rounded-2xl overflow-hidden group/slider border border-slate-200/80 bg-slate-900 select-none`}
      onClick={onImageClick}
    >
      {/* Slide Content: 0 = CAD Schematic */}
      {activeSlide === 0 ? (
        <div className="w-full h-full bg-slate-900 transition-opacity duration-300">
          <BearingSchematic 
            product={product} 
            className="w-full h-full" 
            showLabels={showLabels} 
          />
        </div>
      ) : (
        /* Slide Content: 1 = Real Industrial Photo */
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden transition-opacity duration-300">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={language === 'fa' ? product.nameFa : product.nameEn}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Fallback to high quality industrial stock if remote URL fails
                e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Camera className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs">{language === 'fa' ? 'تصویر واقعی قطعه' : 'Real Part Photo'}</span>
            </div>
          )}

          {/* Genuine Verified Badge Overlay Removed per user request */}
        </div>
      )}

      {/* Top End Slide Badge Indicator */}
      <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-200 text-[10px] font-mono-spec font-bold shadow-sm pointer-events-none">
        {activeSlide === 0 ? '1/2 CAD' : '2/2 Photo'}
      </div>

      {/* Navigation Arrow Controls: Left & Right */}
      <button
        type="button"
        id={`part-slider-prev-${product.id}`}
        aria-label={t.catalog.card.prevSlide}
        onClick={handlePrevSlide}
        className="absolute start-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-slate-900 shadow-md backdrop-blur-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer border border-slate-200/50"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
      </button>

      <button
        type="button"
        id={`part-slider-next-${product.id}`}
        aria-label={t.catalog.card.nextSlide}
        onClick={handleNextSlide}
        className="absolute end-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-slate-900 shadow-md backdrop-blur-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer border border-slate-200/50"
      >
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
      </button>

      {/* Bottom Switcher Pill Tabs (CAD / Real Photo) */}
      <div 
        className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 p-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-lg">
          <button
            type="button"
            id={`part-slide-cad-tab-${product.id}`}
            onClick={(e) => handleSelectSlide(e, 0)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              activeSlide === 0
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{t.catalog.card.slideCad}</span>
          </button>

          <button
            type="button"
            id={`part-slide-photo-tab-${product.id}`}
            onClick={(e) => handleSelectSlide(e, 1)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              activeSlide === 1
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>{t.catalog.card.slidePhoto}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
