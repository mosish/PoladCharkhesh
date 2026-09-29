import React from 'react';
import { Language } from '../types';
import { usePageContent } from '../services/dataService';
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
  const content = usePageContent().whyUs;

  const icons = [
    <ShieldCheck className="w-5 h-5 text-[#95bee8]" key="0" />,
    <Warehouse className="w-5 h-5 text-[#95bee8]" key="1" />,
    <Coins className="w-5 h-5 text-[#95bee8]" key="2" />,
    <Cpu className="w-5 h-5 text-[#95bee8]" key="3" />,
    <CreditCard className="w-5 h-5 text-[#95bee8]" key="4" />,
    <Truck className="w-5 h-5 text-[#95bee8]" key="5" />,
  ];

  return (
    <section id="why-us" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="eyebrow mb-3">
            <span />
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'fa' ? content.tagFa : content.tagEn}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight">
            {language === 'fa' ? content.titleFa : content.titleEn}
          </h2>
        </div>

        {/* 6 Cards Grid (Liquid Glass Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {content.cards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl panel group flex flex-col justify-between text-white"
            >
              <div>
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 w-fit mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  {icons[idx]}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2.5">
                  {language === 'fa' ? card.titleFa : card.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {language === 'fa' ? card.descriptionFa : card.descriptionEn}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-[#c9e8ff]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'fa' ? content.badgeFa : content.badgeEn}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
export default WhyChooseUs;
