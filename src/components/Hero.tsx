import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { RealisticBearingViewer } from './RealisticBearingViewer';
import { 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  PhoneCall
} from 'lucide-react';

interface HeroProps {
  language: Language;
  onSearchSubmit: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ language, onSearchSubmit }) => {
  const [searchInput, setSearchInput] = useState('');
  const t = translations[language];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchSubmit(searchInput.trim());
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const topBrands = [
    { name: 'SKF', origin: language === 'fa' ? 'سوئد' : 'Sweden' },
    { name: 'FAG / INA', origin: language === 'fa' ? 'آلمان' : 'Germany' },
    { name: 'TIMKEN', origin: language === 'fa' ? 'آمریکا' : 'USA' },
    { name: 'NSK', origin: language === 'fa' ? 'ژاپن' : 'Japan' },
    { name: 'NTN', origin: language === 'fa' ? 'ژاپن' : 'Japan' },
    { name: 'KOYO', origin: language === 'fa' ? 'ژاپن' : 'Japan' },
    { name: 'NACHI', origin: language === 'fa' ? 'ژاپن' : 'Japan' },
    { name: 'CORTECO', origin: language === 'fa' ? 'ایتالیا' : 'Italy' },
  ];

  return (
    <section id="home" className="relative overflow-hidden pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24">
      {/* Background Engineering Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40 engineering-grid-light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-start">
            
            {/* Top Badge (Apple Glass Pill) */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#232c86] flex-shrink-0" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              <span className="text-[#232c86] font-mono-spec">
                {t.hero.titleHighlight}
              </span>
              <br />
              <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 mt-2 block">
                {t.hero.titleSuffix}
              </span>
            </h1>

            {/* Fast Search Bar (Apple Liquid Glass Input Container) */}
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto lg:mx-0">
              <div className="relative flex items-center glass-card p-1.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
                <Search className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  id="hero-bearing-search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full pl-10 sm:pl-12 pr-28 sm:pr-32 py-2.5 sm:py-3 bg-transparent rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                
                <button
                  id="hero-search-submit-btn"
                  type="submit"
                  className="glass-btn-primary absolute right-2 px-4 sm:px-5 py-2 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                >
                  {t.hero.searchAction}
                </button>
              </div>
            </form>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <a
                id="hero-view-catalog-btn"
                href="#catalog"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-btn-primary text-white font-bold text-xs sm:text-sm active:scale-95"
              >
                <span>{t.hero.quickSpecs}</span>
                {language === 'fa' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>

              <a
                id="hero-contact-quick-btn"
                href="tel:02177209117"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl glass-btn-secondary text-slate-800 font-bold text-xs sm:text-sm active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-[#232c86]" />
                <span>{t.hero.contactQuick}</span>
              </a>
            </div>

            {/* Key Metric Stats Grid (Apple Frosted Glass Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-start">
              <div className="p-3.5 glass-card rounded-2xl">
                <span className="text-xl sm:text-2xl font-black font-mono-spec text-[#232c86] block">{t.hero.stats.experienceNum}</span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">{t.hero.stats.experienceLabel}</span>
              </div>
              <div className="p-3.5 glass-card rounded-2xl">
                <span className="text-xl sm:text-2xl font-black font-mono-spec text-[#232c86] block">{t.hero.stats.inventoryNum}</span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">{t.hero.stats.inventoryLabel}</span>
              </div>
              <div className="p-3.5 glass-card rounded-2xl">
                <span className="text-xl sm:text-2xl font-black font-mono-spec text-emerald-600 block">{t.hero.stats.authenticityNum}</span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">{t.hero.stats.authenticityLabel}</span>
              </div>
              <div className="p-3.5 glass-card rounded-2xl">
                <span className="text-xl sm:text-2xl font-black font-mono-spec text-sky-600 block">{t.hero.stats.dispatchNum}</span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">{t.hero.stats.dispatchLabel}</span>
              </div>
            </div>

          </div>

          {/* Hero Visual: Revolving Realistic Mechanical Bearing CAD Viewer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <RealisticBearingViewer language={language} />
          </div>

        </div>

        {/* Global Brand Ticker (Liquid Frosted Glass Pills) */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/60">
          <p className="text-center text-xs font-bold text-slate-400 mb-4 sm:mb-6 uppercase tracking-wider">
            {t.hero.brandsTitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3 items-center justify-center">
            {topBrands.map((b) => (
              <div
                key={b.name}
                className="p-3 glass-card rounded-2xl text-center group cursor-default"
              >
                <span className="block font-mono-spec font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#232c86] transition-colors">
                  {b.name}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  {b.origin}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};


