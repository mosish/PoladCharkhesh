import { useSiteCopy } from '../services/useSiteCopy';
import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { usePageContent } from '../services/dataService';
import { 
  ShieldCheck, 
  Truck, 
  Wrench, 
  TrendingDown, 
  Award, 
  Compass, 
  Target 
} from 'lucide-react';

interface AboutUsProps {
  language: Language;
}

export const AboutUs: React.FC<AboutUsProps> = ({ language }) => {
  const t = useSiteCopy(language);
  const pageContent = usePageContent();
  const aboutContent = pageContent.about;

  const featureIcons = [
    <ShieldCheck className="w-5 h-5 text-[#232c86]" key="0" />,
    <Truck className="w-5 h-5 text-[#232c86]" key="1" />,
    <Wrench className="w-5 h-5 text-[#232c86]" key="2" />,
    <TrendingDown className="w-5 h-5 text-[#232c86]" key="3" />,
  ];

  return (
    <section id="about" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">{aboutContent.stats.map((stat, index) => <div className="glass-card-static rounded-2xl p-5" key={index}><strong className="block text-2xl text-[#232c86]">{language === 'fa' ? stat.valueFa : stat.valueEn}</strong><span className="text-sm text-slate-600">{language === 'fa' ? stat.labelFa : stat.labelEn}</span></div>)}</div>
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{language === 'fa' ? aboutContent.tagFa : aboutContent.tagEn}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {language === 'fa' ? aboutContent.titleFa : aboutContent.titleEn}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {language === 'fa' ? aboutContent.paragraph1Fa : aboutContent.paragraph1En}
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {language === 'fa' ? aboutContent.paragraph2Fa : aboutContent.paragraph2En}
          </p>
        </div>

        {/* Mission & Vision Cards (Apple Frosted Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 sm:mb-16">
          {/* Mission */}
          <div className="p-7 sm:p-9 rounded-3xl glass-card relative overflow-hidden group">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/10">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.about.missionTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.about.missionText}
            </p>
          </div>

          {/* Vision */}
          <div className="p-7 sm:p-9 rounded-3xl glass-card relative overflow-hidden group">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/10">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.about.visionTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.about.visionText}
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid (Apple Liquid Glass Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.about.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 glass-card rounded-3xl group"
            >
              <div className="p-3 w-fit rounded-2xl bg-blue-500/10 mb-4 border border-blue-500/10 group-hover:scale-105 transition-transform">
                {featureIcons[idx % featureIcons.length]}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                {feat.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

