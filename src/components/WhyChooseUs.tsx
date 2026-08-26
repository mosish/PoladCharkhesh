import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { 
  ShieldCheck, 
  Warehouse, 
  Coins, 
  Cpu, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

interface WhyChooseUsProps {
  language: Language;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ language }) => {
  const t = translations[language];

  const icons = [
    <ShieldCheck className="w-5 h-5 text-[#232c86]" key="0" />,
    <Warehouse className="w-5 h-5 text-[#232c86]" key="1" />,
    <Coins className="w-5 h-5 text-[#232c86]" key="2" />,
    <Cpu className="w-5 h-5 text-[#232c86]" key="3" />,
    <CreditCard className="w-5 h-5 text-[#232c86]" key="4" />,
    <Truck className="w-5 h-5 text-[#232c86]" key="5" />,
  ];

  return (
    <section id="why-us" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{t.whyUs.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.whyUs.title}
          </h2>
        </div>

        {/* 6 Cards Grid (Apple Liquid Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {t.whyUs.cards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl glass-card group flex flex-col justify-between"
            >
              <div>
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/10 w-fit mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  {icons[idx]}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-[#232c86]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'fa' ? 'تعهد قطعی بازرگانی پولاد چرخِش' : 'PoladCharkhesh Quality Commitment'}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

