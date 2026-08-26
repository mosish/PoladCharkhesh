import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { 
  RotateCw, 
  Phone, 
  MessageCircle, 
  MapPin, 
  ChevronUp, 
  ShieldCheck 
} from 'lucide-react';

interface FooterProps {
  language: Language;
  onSelectBearingCode: (code: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onSelectBearingCode }) => {
  const t = translations[language];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const popularCodes = [
    '6204-2RS',
    '6308-2Z',
    '30208',
    '32210',
    '22212 EK',
    '22316 CC',
    'NU 208 ECP',
    'UCP 205',
    'UCF 208',
    'TC 35-52-10',
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* Top Banner */}
      <div className="border-b border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {language === 'fa' 
                  ? 'تضمین ۱۰۰٪ اصالت و ارائه برگه‌های بازرسی معتبر بین‌المللی' 
                  : '100% Authenticity Guarantee with International QC Inspection'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {t.footer.certText}
              </span>
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <span>{t.footer.backToTop}</span>
            <ChevronUp className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-start">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Company Bio */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 p-1 flex items-center justify-center border border-slate-800">
                <img
                  src="/logo.png"
                  alt="PoladCharkhesh Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-[#232c86]');
                  }}
                />
              </div>
              <span className="text-lg font-black text-white font-mono-spec">
                {language === 'fa' ? 'پولاد چرخِش' : 'PoladCharkhesh'}
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              {t.footer.description}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{t.contact.info.addressValue}</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="tel:02177209117" className="flex items-center gap-1.5 text-slate-300 hover:text-blue-400 font-mono-spec font-semibold">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>021-77209117</span>
                </a>
                <a href="https://wa.me/989127195313" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-400 hover:underline font-mono-spec font-semibold">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>09127195313</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#about" className="hover:text-blue-400 transition-colors">{t.nav.about}</a></li>
              <li><a href="#catalog" className="hover:text-blue-400 transition-colors">{t.nav.products}</a></li>
              <li><a href="#tools" className="hover:text-blue-400 transition-colors">{t.nav.tools}</a></li>
              <li><a href="#why-us" className="hover:text-blue-400 transition-colors">{t.nav.whyUs}</a></li>
              <li><a href="#industries" className="hover:text-blue-400 transition-colors">{t.nav.industries}</a></li>
              <li><a href="#team" className="hover:text-blue-400 transition-colors">{t.nav.team}</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition-colors">{t.nav.contact}</a></li>
            </ul>
          </div>

          {/* Popular Bearing Codes */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.popularProducts}
            </h4>
            <p className="text-[11px] text-slate-500">
              {language === 'fa' 
                ? 'کلیک روی هر کد جهت فیلتر و مشاهده مشخصات فنی در کاتالوگ:' 
                : 'Click any code to filter technical specifications:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    onSelectBearingCode(code);
                    const catalogEl = document.getElementById('catalog');
                    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#232c86] hover:text-white text-slate-300 font-mono-spec text-[11px] border border-slate-800 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="pt-4 text-[11px] text-slate-500 space-y-1">
              <div>{language === 'fa' ? 'برندها: SKF Sweden • FAG Germany • TIMKEN USA • NSK Japan' : 'Brands: SKF Sweden • FAG Germany • TIMKEN USA • NSK Japan'}</div>
              <div>{language === 'fa' ? 'تأمین و توزیع تخصصی انواع بیرینگ صنعتی با تضمین اصالت فیزیکی' : 'Specialized supply of industrial bearings with genuine physical guarantee'}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-900 py-6 bg-slate-950 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-start">
          <p>{t.footer.allRights}</p>
          <p className="font-mono-spec text-[11px]">{t.footer.designedFor}</p>
        </div>
      </div>
    </footer>
  );
};
