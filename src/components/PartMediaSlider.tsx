import React, { useEffect, useState } from 'react';
import type { BearingProduct, Language } from '../types';
import { BearingSchematic } from './BearingSchematic';
import { translations } from '../data/translations';
import { useMediaMetadata } from '../services/mediaService';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface PartMediaSliderProps {
  product: BearingProduct; language: Language; className?: string;
  showLabels?: boolean; onImageClick?: () => void;
}
export const PartMediaSlider: React.FC<PartMediaSliderProps> = ({ product, language, className = 'h-36 sm:h-40', showLabels = false, onImageClick }) => {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const metadata = useMediaMetadata();
  const photos = [...new Set([product.imageUrl, ...(product.images ?? [])].filter(Boolean))];
  const count = photos.length + 1;
  const t = translations[language];
  useEffect(() => { setActive(0); setFailed([]); }, [product.id, product.imageUrl, JSON.stringify(product.images)]);
  const current = Math.min(active, count - 1);
  const url = photos[current - 1];
  const asset = metadata.find(item => item.url === url);
  const alt = (language === 'fa' ? asset?.altTextFa : asset?.altTextEn) || (language === 'fa' ? product.nameFa : product.nameEn);
  return <div className={'relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 ' + className} onClick={onImageClick}>
    {current === 0 ? <BearingSchematic product={product} className="w-full h-full" showLabels={showLabels} /> :
      !failed.includes(url) ? <img src={url} alt={alt} loading="lazy" className="w-full h-full object-contain p-6 pb-12 bg-white" onError={() => setFailed(prev => [...prev, url])} /> :
        <div role="img" aria-label={alt} className="h-full flex flex-col items-center justify-center gap-2 text-slate-300"><Camera /><span className="text-xs">{language === 'fa' ? 'تصویر در دسترس نیست' : 'Image unavailable'}</span></div>}
    <span className="absolute top-2 end-2 rounded-lg px-2 py-1 bg-slate-950/85 text-white text-xs" aria-live="polite">{current + 1} / {count}</span>
    {count > 1 && <><button type="button" className="gallery-arrow start-2" aria-label={t.catalog.card.prevSlide} onClick={e => { e.stopPropagation(); setActive((current - 1 + count) % count); }}><ChevronLeft className="rtl:rotate-180 w-4" /></button>
      <button type="button" className="gallery-arrow end-2" aria-label={t.catalog.card.nextSlide} onClick={e => { e.stopPropagation(); setActive((current + 1) % count); }}><ChevronRight className="rtl:rotate-180 w-4" /></button></>}
    <div className="absolute bottom-2 inset-x-2 flex justify-center gap-1 overflow-x-auto" onClick={e => e.stopPropagation()}>
      <button type="button" className="gallery-tab" aria-pressed={current === 0} onClick={() => setActive(0)}>{t.catalog.card.slideCad}</button>
      {photos.map((photo, i) => <button key={photo} type="button" className="gallery-tab" aria-pressed={current === i + 1} aria-label={t.catalog.card.slidePhoto + ' ' + (i + 1)} onClick={() => setActive(i + 1)}>{i + 1}</button>)}
    </div>
  </div>;
};
