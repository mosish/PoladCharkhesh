import React from 'react';
import { Language } from '../types';
import { usePageContent } from '../services/dataService';
import { 
  Factory, 
  Car, 
  Mountain, 
  Flame, 
  Fuel, 
  Tractor, 
  Zap
} from 'lucide-react';

interface IndustriesProps {
  language: Language;
  onSelectBearingCode: (code: string) => void;
}

export const Industries: React.FC<IndustriesProps> = ({
  language,
  onSelectBearingCode,
}) => {
  const content = usePageContent().industries;

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5 text-[#95bee8]";
    switch (iconName) {
      case 'Car': return <Car className={iconClass} />;
      case 'Mountain': return <Mountain className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Fuel': return <Fuel className={iconClass} />;
      case 'Tractor': return <Tractor className={iconClass} />;
      case 'Zap': return <Zap className={iconClass} />;
      default: return <Factory className={iconClass} />;
    }
  };

  return (
    <section id="industries" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="eyebrow mb-3">
            <span />
            <Factory className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>{language === 'fa' ? content.tagFa : content.tagEn}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight">
            {language === 'fa' ? content.titleFa : content.titleEn}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-300">
            {language === 'fa' ? content.subtitleFa : content.subtitleEn}
          </p>
        </div>

        {/* 6 Industries Grid (Liquid Glass Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {content.items.map((ind, idx) => (
            <div
              key={ind.id}
              className="p-6 sm:p-8 rounded-3xl panel flex flex-col justify-between group text-white relative overflow-hidden"
            >
              <div className="absolute top-5 right-5 text-2xl font-mono font-bold text-white/10 pointer-events-none" dir="ltr">
                {String(idx + 1).padStart(2, '0')}
              </div>

              <div>
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 w-fit mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  {getIcon(ind.icon)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2.5">
                  {language === 'fa' ? ind.titleFa : ind.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  {language === 'fa' ? ind.descriptionFa : ind.descriptionEn}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2.5">
                  {language === 'fa' ? content.recommendedLabelFa : content.recommendedLabelEn}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ind.recommendedBearings.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onSelectBearingCode(code.split(' ')[0])}
                      className="px-3 py-1.5 text-xs font-mono font-medium rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all shadow-sm cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
export default Industries;
