import React from 'react';
import { Language } from '../types';
import { translations, industryApplications } from '../data/translations';
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
  const t = translations[language];

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5 text-[#232c86]";
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Factory className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{t.industries.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.industries.title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            {t.industries.subtitle}
          </p>
        </div>

        {/* 6 Industries Grid (Apple Liquid Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {industryApplications.map((ind) => (
            <div
              key={ind.id}
              className="p-6 sm:p-8 rounded-3xl glass-card flex flex-col justify-between group"
            >
              <div>
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/10 w-fit mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  {getIcon(ind.icon)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">
                  {language === 'fa' ? ind.titleFa : ind.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  {language === 'fa' ? ind.descriptionFa : ind.descriptionEn}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2.5">
                  {language === 'fa' ? 'کدهای پیشنهادی و پرکاربرد:' : 'Recommended Parts:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ind.recommendedBearings.map((code) => (
                    <button
                      key={code}
                      onClick={() => onSelectBearingCode(code.split(' ')[0])}
                      className="px-3 py-1.5 text-xs font-mono-spec font-medium rounded-full glass-pill text-slate-700 hover:text-[#232c86] hover:bg-white/90 transition-all shadow-sm"
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

