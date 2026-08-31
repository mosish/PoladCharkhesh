import React, { useState, useEffect, useCallback } from 'react';
import { Language, BearingProduct } from './types';
import { bearingProducts as canonicalProducts } from './data/products';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { AdminTab, AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminMedia } from './components/admin/AdminMedia';
import { AdminCompany } from './components/admin/AdminCompany';
import { AdminContact } from './components/admin/AdminContact';
import { AdminContent } from './components/admin/AdminContent';
import { AdminSeo } from './components/admin/AdminSeo';
import { AdminSystem } from './components/admin/AdminSystem';
import { ProductFormModal } from './components/admin/ProductFormModal';

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
  | { type: 'product'; slug: string }
  | { type: 'admin'; tab?: AdminTab };

function parseCurrentRoute(): RouteState {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // 1. Admin route: /admin or #/admin or #admin
  if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash.startsWith('#admin')) {
    const tabMatch = hash.match(/#\/?admin\/([a-z0-9_-]+)/i);
    const tab = (tabMatch ? tabMatch[1] : 'overview') as AdminTab;
    return { type: 'admin', tab: tab || 'overview' };
  }

  // 2. Direct path: /product/:slug
  const productPathMatch = path.match(/^\/product\/([^/]+)/i);
  if (productPathMatch) {
    return { type: 'product', slug: decodeURIComponent(productPathMatch[1]) };
  }

  // 3. Hash-based product route: #/product/:slug or #product/:slug
  const hashProductMatch = hash.match(/^#\/?product\/([^/]+)/i);
  if (hashProductMatch) {
    return { type: 'product', slug: decodeURIComponent(hashProductMatch[1]) };
  }

  // 4. Section hash: #catalog, #about, #contact, etc.
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
  // Default language is Persian ('fa')
  const [language, setLanguage] = useState<Language>('fa');
  
  // Routing state
  const [route, setRoute] = useState<RouteState>(parseCurrentRoute);

  // Live products dataset subscribed from central dataService
  const [allProducts, setAllProducts] = useState<BearingProduct[]>(dataService.getActiveProducts());

  // Admin state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [adminAddModalOpen, setAdminAddModalOpen] = useState<boolean>(false);

  // Quick Spec Modal (if triggered in quick view mode)
  const [selectedProduct, setSelectedProduct] = useState<BearingProduct | null>(null);
  
  // Shared Search / Filter Query across components
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Subscribe to live products from dataService
  useEffect(() => {
    const unsubProducts = dataService.subscribeToProducts((updated) => {
      setAllProducts(updated.filter((p) => !p.isArchived));
    });
    const unsubAuth = authService.subscribe((session) => {
      setIsAuthenticated(!!session && Date.now() < session.expiresAt);
    });

    return () => {
      unsubProducts();
      unsubAuth();
    };
  }, []);

  // Handle URL change events (browser Back / Forward buttons & Hash changes)
  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = parseCurrentRoute();
      setRoute(parsed);
      if (parsed.type === 'admin' && parsed.tab) {
        setAdminTab(parsed.tab);
      }
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

    if (route.type === 'admin') {
      document.documentElement.classList.add('dark');
      document.title = language === 'fa' ? 'پنل مدیریت | بازرگانی پولاد چرخِش' : 'Admin Portal | Polad Charkhesh';
    } else {
      document.documentElement.classList.remove('dark');

      if (route.type === 'product') {
        const product = findProductBySlug(route.slug, allProducts);
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
    }
  }, [language, route, allProducts]);

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

  const navigateToAdmin = useCallback((tab: AdminTab = 'overview') => {
    const targetPath = `/#admin/${tab}`;
    window.history.pushState(null, '', targetPath);
    setRoute({ type: 'admin', tab });
    setAdminTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToCatalog = useCallback((category: string = 'all', search: string = '') => {
    setCatalogCategory(category);
    if (search) setCatalogSearch(search);
    navigateToHome('catalog');
  }, [navigateToHome]);

  const handleSelectBearingCode = (code: string) => {
    const matched = findProductBySlug(code, allProducts);
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
    if (sectionId === 'admin') {
      navigateToAdmin('overview');
    } else {
      navigateToHome(sectionId);
    }
  };

  // --- ADMIN VIEW RENDERING ---
  if (route.type === 'admin') {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          language={language}
          onSuccess={() => {
            setIsAuthenticated(true);
            navigateToAdmin('overview');
          }}
          onExitToPublicSite={() => navigateToHome()}
        />
      );
    }

    return (
      <AdminLayout
        language={language}
        activeTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          window.history.replaceState(null, '', `/#admin/${tab}`);
        }}
        onToggleLanguage={toggleLanguage}
        onExitToPublicSite={() => navigateToHome()}
      >
        {adminTab === 'overview' && (
          <AdminOverview
            language={language}
            onNavigateTab={(tab) => {
              setAdminTab(tab);
              window.history.replaceState(null, '', `/#admin/${tab}`);
            }}
            onOpenAddProductModal={() => setAdminAddModalOpen(true)}
          />
        )}

        {adminTab === 'products' && (
          <AdminProducts
            language={language}
            onOpenProductPage={navigateToProduct}
          />
        )}

        {adminTab === 'media' && (
          <AdminMedia language={language} />
        )}

        {adminTab === 'company' && (
          <AdminCompany language={language} />
        )}

        {adminTab === 'contact' && (
          <AdminContact language={language} />
        )}

        {adminTab === 'content' && (
          <AdminContent language={language} />
        )}

        {adminTab === 'seo' && (
          <AdminSeo language={language} />
        )}

        {adminTab === 'system' && (
          <AdminSystem language={language} />
        )}

        {/* Global Add Product Modal for quick shortcut */}
        <ProductFormModal
          language={language}
          product={null}
          isOpen={adminAddModalOpen}
          onClose={() => setAdminAddModalOpen(false)}
          onSave={(data) => dataService.addProduct(data, 'admin')}
        />
      </AdminLayout>
    );
  }

  // --- PUBLIC SITE VIEW RENDERING ---
  const currentProduct = route.type === 'product' ? findProductBySlug(route.slug, allProducts) : undefined;

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
              allProducts={allProducts}
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
              products={allProducts}
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

      {/* Footer with discrete Admin portal access */}
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
