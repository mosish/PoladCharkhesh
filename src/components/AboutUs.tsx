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
  const t = translations[language];
  const pageContent = usePageContent();
  const aboutContent = pageContent.about;

  const featureIcons = [
    <ShieldCheck className="w-5 h-5 text-[#95bee8]" key="0" />,
    <Truck className="w-5 h-5 text-[#95bee8]" key="1" />,
    <Wrench className="w-5 h-5 text-[#95bee8]" key="2" />,
    <TrendingDown className="w-5 h-5 text-[#95bee8]" key="3" />,
  ];

  return (
    <section id="about" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="eyebrow mb-3">
            <span />
            <Compass className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>{language === 'fa' ? aboutContent.tagFa : aboutContent.tagEn}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight leading-tight">
            {language === 'fa' ? aboutContent.titleFa : aboutContent.titleEn}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {language === 'fa' ? aboutContent.paragraph1Fa : aboutContent.paragraph1En}
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {language === 'fa' ? aboutContent.paragraph2Fa : aboutContent.paragraph2En}
          </p>
        </div>

        {/* Mission & Vision Cards (Liquid Glass Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 sm:mb-16">
          {/* Mission */}
          <div className="p-7 sm:p-9 rounded-3xl panel relative overflow-hidden group text-white">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3.5 rounded-2xl bg-white/10 text-[#c9e8ff] border border-white/15">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {t.about.missionTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.about.missionText}
            </p>
          </div>

          {/* Vision */}
          <div className="p-7 sm:p-9 rounded-3xl panel relative overflow-hidden group text-white">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {t.about.visionTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.about.visionText}
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid (Liquid Glass Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.about.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 panel rounded-3xl group text-white"
            >
              <div className="p-3 rounded-2xl bg-white/10 text-[#c9e8ff] border border-white/15 w-fit mb-4 group-hover:scale-110 transition-transform">
                {featureIcons[idx % featureIcons.length]}
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                {feat.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
export default AboutUs;
