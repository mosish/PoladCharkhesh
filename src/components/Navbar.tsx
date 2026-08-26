import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Menu, 
  X, 
  Globe, 
  MessageCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { Logo } from './Logo';

interface NavbarProps {
  language: Language;
  onLanguageToggle: () => void;
  onContactClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageToggle,
  onContactClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: t.nav.home },
    { href: '#about', label: t.nav.about },
    { href: '#catalog', label: t.nav.products },
    { href: '#tools', label: t.nav.tools },
    { href: '#why-us', label: t.nav.whyUs },
    { href: '#industries', label: t.nav.industries },
    { href: '#team', label: t.nav.team },
    { href: '#contact', label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-200">
      {/* Top Notification / Contact Bar */}
      <div className="bg-[#1a226b] text-slate-100 text-xs py-1.5 px-3 sm:px-4 border-b border-blue-900 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px] sm:text-xs truncate whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span className="truncate whitespace-nowrap">{t.topBar.announcement}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-slate-200 text-[11px] font-mono-spec flex-shrink-0 whitespace-nowrap">
            <span className="hidden md:flex items-center gap-1 text-blue-100 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="whitespace-nowrap">{t.topBar.hours}</span>
            </span>
            <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
              <a 
                href="tel:02177209117" 
                className="flex items-center gap-1 text-white hover:text-amber-300 font-bold transition-colors whitespace-nowrap"
                title="تماس تلفنی"
              >
                <Phone className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="hidden xs:inline whitespace-nowrap">021-77209117</span>
                <span className="xs:hidden font-bold whitespace-nowrap">02177209117</span>
              </a>
              <span className="text-blue-400/70">|</span>
              <a 
                href="https://wa.me/989127195313" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-semibold whitespace-nowrap"
                title="واتس‌اپ"
              >
                <MessageCircle className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">09127195313</span>
                <span className="sm:hidden whitespace-nowrap">WhatsApp</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className={`w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] py-2.5 sm:py-3 border-b border-white/80' 
          : 'bg-white/80 backdrop-blur-xl py-3 sm:py-3.5 border-b border-slate-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            
            {/* Brand Logo with Official PooladCharkhesh Emblem */}
            <a 
              href="#home" 
              className="flex items-center group focus:outline-none flex-shrink-0 transition-transform duration-200 active:scale-95"
              title="پولاد چرخِش"
            >
              <Logo 
                variant="horizontal" 
                size="md" 
                isDark={false}
                language={language}
                className="max-w-[190px] xs:max-w-[230px] sm:max-w-none"
              />
            </a>

            {/* Desktop Navigation Links (Apple Glass Capsule Menu) */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/70 backdrop-blur-md rounded-full border border-white/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)]">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-[#232c86] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] transition-all whitespace-nowrap flex-shrink-0"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Action Buttons: Language & Direct Call */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              
              {/* Language Switcher */}
              <button
                id="language-switcher-btn"
                onClick={onLanguageToggle}
                className="glass-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 whitespace-nowrap"
                title={language === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی'}
              >
                <Globe className="w-3.5 h-3.5 text-[#232c86] flex-shrink-0" />
                <span className="whitespace-nowrap">{t.nav.langToggle}</span>
              </button>

              {/* Direct Call & Inquiry CTA Button */}
              <a
                id="navbar-call-inquiry-btn"
                href="tel:02177209117"
                className="glass-btn-primary flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="whitespace-nowrap">{t.nav.callAction}</span>
              </a>

            </div>

            {/* Mobile Menu & Toggles Button */}
            <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
              <button
                id="mobile-lang-btn"
                onClick={onLanguageToggle}
                className="p-2 rounded-full text-slate-700 glass-btn-secondary active:scale-95 transition-transform"
                title="Language"
              >
                <Globe className="w-4 h-4 text-[#232c86]" />
              </button>

              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-slate-800 glass-btn-secondary active:scale-95 transition-all"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-[#232c86]" /> : <Menu className="w-4 h-4 text-[#232c86]" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Full-Featured Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 glass-panel border-b border-white/80 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl max-h-[80vh] overflow-y-auto mt-2 mx-2 rounded-3xl">
            <div className="grid grid-cols-2 gap-2 pb-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-800 bg-white/60 hover:bg-white/90 hover:text-[#232c86] transition-colors whitespace-nowrap truncate border border-white/60 shadow-sm"
                >
                  <span className="truncate">{link.label}</span>
                  {language === 'fa' ? <ChevronLeft className="w-3.5 h-3.5 opacity-50 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-2">
              <a
                href="tel:02177209117"
                onClick={() => setMobileMenuOpen(false)}
                className="glass-btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-98 transition-all whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span className="whitespace-nowrap">{t.nav.directCall}</span>
              </a>

              <a
                href="https://wa.me/989127195313"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600/90 backdrop-blur-md text-white font-bold text-sm shadow-sm active:scale-98 transition-all whitespace-nowrap border border-white/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="whitespace-nowrap">{language === 'fa' ? 'استعلام واتس‌اپ: ۰۹۱۲۷۱۹۵۳۱۳' : 'WhatsApp: +989127195313'}</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

