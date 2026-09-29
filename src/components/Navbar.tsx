import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Menu, 
  X, 
  Globe2, 
  MessageCircle, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { useCompanyInfo } from '../services/dataService';

interface NavbarProps {
  language: Language;
  onLanguageToggle: () => void;
  onContactClick: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageToggle,
  onContactClick,
  onNavigateSection,
}) => {
  const company = useCompanyInfo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];
  const isFa = language === 'fa';

  const handleNavLinkClick = (e: React.MouseEvent, href: string) => {
    if (onNavigateSection) {
      e.preventDefault();
      const sectionId = href.replace(/^#/, '');
      onNavigateSection(sectionId);
      setMobileMenuOpen(false);
    }
  };

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
    <>
      {/* Top Utility Bar */}
      <div className="utility flex items-center justify-between text-[11px] sm:text-xs">
        <span className="truncate">
          {isFa
            ? 'تأمین تخصصی بیرینگ، یاتاقان و قطعات صنعتی'
            : 'BEARINGS. ENGINEERING. CONTINUITY.'}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline font-mono">
            {company.landlinePhoneDisplayEn || '021-77209117'}
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline">
            {isFa ? 'ساعات کاری: ۰۸:۰۰ الی ۱۶:۰۰' : 'Hours: 08:00–16:00'}
          </span>
        </div>
      </div>

      {/* Floating Liquid-Glass Navigation Bar */}
      <header className="navigation sticky top-3 z-40">
        <a 
          href="#home" 
          onClick={(e) => handleNavLinkClick(e, '#home')}
          className="brand flex items-center gap-3 cursor-pointer"
        >
          <img
            src="/brand/logo.png"
            alt={isFa ? 'نشان تجاری پولاد چرخش' : 'Polad Charkhesh'}
            className="brand-logo object-contain"
            width={48}
            height={48}
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-wide text-white leading-tight">
              {isFa ? 'پولاد چرخِش' : 'POLAD CHARKHESH'}
            </span>
            <small className="text-[9px] tracking-widest text-slate-300 font-medium">
              {isFa ? 'مهندسی و تأمین بیرینگ‌های صنعتی' : 'INDUSTRIAL ENGINEERING'}
            </small>
          </div>
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-xs sm:text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            id="language-switcher-btn"
            type="button"
            onClick={onLanguageToggle}
            className="language flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-xs font-medium"
            aria-label={isFa ? 'Switch to English' : 'تغییر به زبان فارسی'}
            title={isFa ? 'Switch to English' : 'تغییر به زبان فارسی'}
          >
            <Globe2 size={15} />
            <span>{isFa ? 'EN' : 'فارسی'}</span>
          </button>

          {/* Consultation CTA */}
          <a
            id="navbar-contact-cta"
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onContactClick();
            }}
            className="nav-contact hidden sm:inline-flex items-center gap-2 cursor-pointer text-xs font-semibold"
          >
            <span>{isFa ? 'مشاوره مهندسی' : "Let's talk engineering"}</span>
            <ArrowUpRight size={15} />
          </a>

          {/* Mobile Menu Toggle Button */}
          <button
            id="mobile-nav-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="w-full lg:hidden pt-3 mt-2 border-t border-white/15 grid grid-cols-2 gap-2 pb-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavLinkClick(e, link.href)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/15 transition-colors text-center"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                onContactClick();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 py-2.5 rounded-xl button primary text-center font-bold text-xs"
            >
              {isFa ? 'مشاوره مهندسی و استعلام' : "Let's talk engineering"}
            </a>
          </div>
        )}
      </header>
    </>
  );
};
export default Navbar;
