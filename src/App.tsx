import React, { useState, useEffect, useCallback } from 'react';
import { Language, BearingProduct } from './types';
import { bearingProducts } from './data/products';
import { findProductBySlug, getProductSlug } from './utils/productSlug';
import { updateDocumentSeo } from './utils/seo';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductPage } from './components/ProductPage';
import { ProductNotFound } from './components/ProductNotFound';
import { BearingCalculator } from './components/BearingCalculator';
import { WhyChooseUs } from './components/WhyChooseUs';
import { Industries } from './components/Industries';
import { TeamMembers } from './components/TeamMembers';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { BearingSpecModal } from './components/BearingSpecModal';
import { FloatingActions } from './components/FloatingActions';

type RouteState =
  | { type: 'home'; section?: string }
  | { type: 'catalog'; category?: string; search?: string }
  | { type: 'product'; slug: string };

function parseCurrentRoute(): RouteState {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // 1. Direct path: /product/:slug
  const productPathMatch = path.match(/^\/product\/([^/]+)/i);
  if (productPathMatch) {
    return { type: 'product', slug: decodeURIComponent(productPathMatch[1]) };
  }

  // 2. Hash-based product route: #/product/:slug or #product/:slug
  const hashProductMatch = hash.match(/^#\/?product\/([^/]+)/i);
  if (hashProductMatch) {
    return { type: 'product', slug: decodeURIComponent(hashProductMatch[1]) };
  }

  // 3. Section hash: #catalog, #about, #contact, etc.
  if (hash.startsWith('#')) {
    const section = hash.replace(/^#\/?/, '');
    if (section === 'catalog') {
      return { type: 'catalog' };
    }
    if (section) {
      return { type: 'home', section };
    }
  }

  return { type: 'home' };
}

export default function App() {
  // Default language is Persian ('fa'), site is exclusively light theme
  const [language, setLanguage] = useState<Language>('fa');
  
  // Routing state
  const [route, setRoute] = useState<RouteState>(parseCurrentRoute);

  // Quick Spec Modal (if triggered in quick view mode)
  const [selectedProduct, setSelectedProduct] = useState<BearingProduct | null>(null);
  
  // Shared Search / Filter Query across components
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Handle URL change events (browser Back / Forward buttons & Hash changes)
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Synchronize HTML attributes on language switch & Route Changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.classList.remove('dark');

    if (route.type === 'product') {
      const product = findProductBySlug(route.slug, bearingProducts);
      updateDocumentSeo({
        product,
        language,
        path: `/product/${route.slug}`,
      });
    } else {
      updateDocumentSeo({
        language,
        path: window.location.pathname,
      });
    }
  }, [language, route]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  // --- NAVIGATION HANDLERS ---

  const navigateToProduct = useCallback((slug: string) => {
    const targetPath = `/product/${slug}`;
    window.history.pushState(null, '', targetPath);
    setRoute({ type: 'product', slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToHome = useCallback((sectionId?: string) => {
    const targetPath = sectionId ? `/#${sectionId}` : '/';
    window.history.pushState(null, '', targetPath);
    setRoute({ type: 'home', section: sectionId });

    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const navigateToCatalog = useCallback((category: string = 'all', search: string = '') => {
    setCatalogCategory(category);
    if (search) setCatalogSearch(search);
    navigateToHome('catalog');
  }, [navigateToHome]);

  const handleSelectBearingCode = (code: string) => {
    // Check if code corresponds to a known product
    const matched = findProductBySlug(code, bearingProducts);
    if (matched) {
      navigateToProduct(getProductSlug(matched));
    } else {
      setCatalogSearch(code);
      navigateToHome('catalog');
    }
  };

  const handleContactClick = () => {
    navigateToHome('contact');
  };

  const handleSectionNavigate = (sectionId: string) => {
    navigateToHome(sectionId);
  };

  // Resolved product for product page view
  const currentProduct = route.type === 'product' ? findProductBySlug(route.slug, bearingProducts) : undefined;

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
        onNavigateSection={handleSectionNavigate}
      />

      {/* Dynamic View: Product Page vs Single Page Scrolling Home */}
      <main className="flex-1 space-y-4 sm:space-y-6">
        {route.type === 'product' ? (
          currentProduct ? (
            <ProductPage
              product={currentProduct}
              allProducts={bearingProducts}
              language={language}
              onNavigateHome={() => navigateToHome()}
              onNavigateCatalog={(cat) => navigateToCatalog(cat || 'all')}
              onNavigateProduct={navigateToProduct}
              onNavigateCalculator={(code) => {
                if (code) setCatalogSearch(code);
                navigateToHome('tools');
              }}
            />
          ) : (
            <ProductNotFound
              language={language}
              searchedSlug={route.slug}
              onReturnToCatalog={(q) => navigateToCatalog('all', q)}
            />
          )
        ) : (
          <>
            <Hero
              language={language}
              onSearchSubmit={(q) => {
                setCatalogSearch(q);
                const catalogEl = document.getElementById('catalog');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <AboutUs language={language} />

            <ProductCatalog
              products={bearingProducts}
              language={language}
              selectedBearingCode={catalogSearch}
              initialCategory={catalogCategory}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onNavigateProduct={navigateToProduct}
            />

            <BearingCalculator language={language} />

            <WhyChooseUs language={language} />

            <Industries
              language={language}
              onSelectBearingCode={handleSelectBearingCode}
            />

            <TeamMembers language={language} />

            <ContactSection language={language} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onSelectBearingCode={handleSelectBearingCode}
        onNavigateSection={handleSectionNavigate}
        onNavigateProduct={navigateToProduct}
      />

      {/* Floating Direct Call & WhatsApp & Back To Top Actions */}
      <FloatingActions language={language} />

      {/* Detailed Technical Spec Modal (for secondary quick-view if invoked) */}
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
