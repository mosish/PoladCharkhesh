import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { COMPANY_INFO } from '../data/company';

interface FloatingActionsProps {
  language: Language;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  language,
}) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`fixed bottom-6 ${language === 'fa' ? 'left-6' : 'right-6'} z-40 flex flex-col items-center gap-3`}>
      
      {/* Back to Top */}
      {showBackToTop && (
        <button
          id="floating-back-to-top-btn"
          onClick={scrollToTop}
          className="w-12 h-12 rounded-full glass-card text-slate-700 shadow-lg hover:text-[#232c86] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={t.footer.backToTop}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* WhatsApp Direct Chat */}
      <a
        id="floating-whatsapp-btn"
        href={COMPANY_INFO.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full bg-emerald-500/90 backdrop-blur-md hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/30"
        title={language === 'fa' ? `گفتگو در واتس‌اپ: ${COMPANY_INFO.primaryPhone}` : `Chat on WhatsApp: ${COMPANY_INFO.primaryPhone}`}
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Direct Phone Call */}
      <a
        id="floating-call-btn"
        href={COMPANY_INFO.primaryPhoneTel}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#232c86] to-[#3a44ad] text-white shadow-xl shadow-blue-900/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/30"
        title={language === 'fa' ? `تماس مستقیم: ${COMPANY_INFO.primaryPhoneDisplayFa}` : `Call: ${COMPANY_INFO.primaryPhoneDisplayEn}`}
      >
        <Phone className="w-6 h-6 text-amber-300" />
      </a>

    </div>
  );
};

