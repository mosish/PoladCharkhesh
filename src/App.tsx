import React, { useState, useEffect } from 'react';
import { Language, BearingProduct } from './types';
import { bearingProducts } from './data/products';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { ProductCatalog } from './components/ProductCatalog';
import { BearingCalculator } from './components/BearingCalculator';
import { BearingThermalEstimator } from './components/BearingThermalEstimator';
import { WhyChooseUs } from './components/WhyChooseUs';
import { Industries } from './components/Industries';
import { TeamMembers } from './components/TeamMembers';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { BearingSpecModal } from './components/BearingSpecModal';
import { FloatingActions } from './components/FloatingActions';

export default function App() {
  // Default language is Persian ('fa'), site is exclusively light theme
  const [language, setLanguage] = useState<Language>('fa');
  
  // Modals
  const [selectedProduct, setSelectedProduct] = useState<BearingProduct | null>(null);
  
  // Shared Search / Filter Query across components
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Synchronize HTML attributes on language switch (RTL for Persian, LTR for English)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.classList.remove('dark');
    if (language === 'fa') {
      document.title = 'پولاد چرخِش | تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد';
    } else {
      document.title = 'PoladCharkhesh | Supply and distribution of all types of oil, mining and steel bearings';
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const handleSelectBearingCode = (code: string) => {
    setCatalogSearch(code);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactClick = () => {
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col liquid-mesh-bg text-slate-900 relative overflow-x-clip">
      {/* Apple Liquid Glass Ambient Light Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[30rem] h-[30rem] bg-indigo-500/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-10 w-[28rem] h-[28rem] bg-amber-400/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sticky Header Navigation */}
      <Navbar
        language={language}
        onLanguageToggle={toggleLanguage}
        onContactClick={handleContactClick}
      />

      {/* Main Single Page Scrolling Content */}
      <main className="flex-1 space-y-4 sm:space-y-6">
        <Hero
          language={language}
          onSearchSubmit={(q) => {
            setCatalogSearch(q);
          }}
        />

        <AboutUs language={language} />

        <ProductCatalog
          products={bearingProducts}
          language={language}
          selectedBearingCode={catalogSearch}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        <BearingCalculator language={language} />

        <BearingThermalEstimator language={language} />

        <WhyChooseUs language={language} />

        <Industries
          language={language}
          onSelectBearingCode={handleSelectBearingCode}
        />

        <TeamMembers language={language} />

        <ContactSection language={language} />
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onSelectBearingCode={handleSelectBearingCode}
      />

      {/* Floating Direct Call & WhatsApp & Back To Top Actions */}
      <FloatingActions language={language} />

      {/* Detailed Technical Spec Modal */}
      {selectedProduct && (
        <BearingSpecModal
          product={selectedProduct}
          language={language}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

