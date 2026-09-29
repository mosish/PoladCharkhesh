import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { useCompanyInfo, usePageContent } from '../services/dataService';
import { HeroBearing } from './HeroBearing';
import { 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  ArrowUpRight,
  PhoneCall
} from 'lucide-react';

interface HeroProps {
  language: Language;
  onSearchSubmit: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ language, onSearchSubmit }) => {
  const company = useCompanyInfo();
  const pageContent = usePageContent();
  const [searchInput, setSearchInput] = useState('');
  const t = translations[language];
  const heroContent = pageContent.hero;
  const isFa = language === 'fa';

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

  const handleQuickSearch = (code: string) => {
    setSearchInput(code);
    onSearchSubmit(code);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const topBrands = [
    { name: 'SKF', origin: isFa ? 'سوئد' : 'Sweden' },
    { name: 'FAG / INA', origin: isFa ? 'آلمان' : 'Germany' },
    { name: 'TIMKEN', origin: isFa ? 'آمریکا' : 'USA' },
    { name: 'NSK', origin: isFa ? 'ژاپن' : 'Japan' },
    { name: 'NTN', origin: isFa ? 'ژاپن' : 'Japan' },
    { name: 'KOYO', origin: isFa ? 'ژاپن' : 'Japan' },
    { name: 'NACHI', origin: isFa ? 'ژاپن' : 'Japan' },
    { name: 'CORTECO', origin: isFa ? 'ایتالیا' : 'Italy' },
  ];

  return (
    <section id="home" className="relative overflow-hidden pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Main Hero Copy Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 text-start hero-copy">
            
            {/* Top Eyebrow Badge */}
            <div className="eyebrow">
              <span />
              <ShieldCheck className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0" />
              <span>{isFa ? heroContent.badgeFa : heroContent.badgeEn}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.12]">
              <span className="text-white block font-mono-spec">
                {isFa ? heroContent.titleHighlightFa : heroContent.titleHighlightEn}
              </span>
              <span className="hero-last text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-normal block mt-2">
                {isFa ? heroContent.titleSuffixFa : heroContent.titleSuffixEn}
              </span>
            </h1>

            {/* Description Paragraph */}
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
              {isFa ? heroContent.descriptionFa : heroContent.descriptionEn}
            </p>

            {/* Hero Fast Search Bar */}
            <form onSubmit={handleSearch} className="hero-search w-full max-w-xl">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                id="hero-bearing-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isFa ? 'کد بیرینگ، ابعاد یا کاربرد (مثال: 6204)...' : 'Search bearing code, dimensions or application…'}
                aria-label={isFa ? 'جستجوی کد بیرینگ' : 'Search bearing catalog'}
              />
              <button
                id="hero-search-submit-btn"
                type="submit"
                aria-label={isFa ? 'جستجو' : 'Search'}
                className="text-slate-300 hover:text-white"
              >
                {isFa ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
            </form>

            {/* Quick Search Hints */}
            <div className="search-hints">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isFa ? 'جستجوی سریع:' : 'QUICK SEARCH:'}
              </span>
              {['6204', '22212', 'NU208', '32008'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleQuickSearch(code)}
                  className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all"
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                id="hero-view-catalog-btn"
                href="#catalog"
                className="button primary"
              >
                <span>{isFa ? 'مشاهده کاتالوگ محصولات' : 'Explore product catalog'}</span>
                {isFa ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </a>

              <a
                id="hero-contact-quick-btn"
                href={company.primaryPhoneTel}
                className="button"
              >
                <PhoneCall size={16} className="text-[#95bee8]" />
                <span>{isFa ? 'مشاوره فنی و استعلام' : 'Talk to an engineer'}</span>
                <ArrowUpRight size={16} />
              </a>
            </div>

            {/* Key Capability Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
              <div className="p-3 panel rounded-xl">
                <span className="text-xl font-bold font-mono text-[#c9e8ff] block">
                  {t.hero.stats.experienceNum}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.hero.stats.experienceLabel}
                </span>
              </div>
              <div className="p-3 panel rounded-xl">
                <span className="text-xl font-bold font-mono text-[#c9e8ff] block">
                  {t.hero.stats.inventoryNum}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.hero.stats.inventoryLabel}
                </span>
              </div>
              <div className="p-3 panel rounded-xl">
                <span className="text-xl font-bold font-mono text-emerald-400 block">
                  {t.hero.stats.authenticityNum}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.hero.stats.authenticityLabel}
                </span>
              </div>
              <div className="p-3 panel rounded-xl">
                <span className="text-xl font-bold font-mono text-sky-400 block">
                  {t.hero.stats.dispatchNum}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.hero.stats.dispatchLabel}
                </span>
              </div>
            </div>

          </div>

          {/* Hero Visual: Revolving 3D Three.js Precision Bearing Showcase */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <HeroBearing language={language} />
          </div>

        </div>

        {/* Global Brand Ticker (Liquid Glass Pills) */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-white/10">
          <p className="text-center text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            {t.hero.brandsTitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-2.5 items-center justify-center">
            {topBrands.map((b) => (
              <div
                key={b.name}
                className="p-2.5 panel rounded-xl text-center group cursor-default"
              >
                <span className="block font-mono font-bold text-xs sm:text-sm text-slate-200 group-hover:text-[#95bee8] transition-colors">
                  {b.name}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
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
export default Hero;
