import React, { useState } from 'react';
import { Language } from '../../types';
import { authService } from '../../services/authService';
import { 
  LayoutDashboard, 
  Package, 
  Image, 
  Building2, 
  Phone, 
  FileText, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  Languages, 
  Menu, 
  X,
  Lock,
  UserCircle
} from 'lucide-react';

export type AdminTab = 
  | 'overview' 
  | 'products' 
  | 'media' 
  | 'company' 
  | 'contact' 
  | 'content' 
  | 'seo' 
  | 'system';

interface AdminLayoutProps {
  language: Language;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onToggleLanguage: () => void;
  onExitToPublicSite: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  language,
  activeTab,
  onSelectTab,
  onToggleLanguage,
  onExitToPublicSite,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  const navItems: Array<{ id: AdminTab; labelFa: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', labelFa: 'داشبورد و وضعیت', labelEn: 'Overview & Status', icon: LayoutDashboard },
    { id: 'products', labelFa: 'مدیریت محصولات (۶۸+)', labelEn: 'Product Catalog', icon: Package },
    { id: 'media', labelFa: 'رسانه و تصاویر', labelEn: 'Media & Images', icon: Image },
    { id: 'company', labelFa: 'اطلاعات هویتی شرکت', labelEn: 'Company Identity', icon: Building2 },
    { id: 'contact', labelFa: 'راه‌های ارتباط و استعلام', labelEn: 'Contact & Inquiries', icon: Phone },
    { id: 'content', labelFa: 'محتوای متنی سایت (CMS)', labelEn: 'Page Content (CMS)', icon: FileText },
    { id: 'seo', labelFa: 'تنظیمات سئو و متاتگ‌ها', labelEn: 'SEO & Meta Tags', icon: Globe },
    { id: 'system', labelFa: 'امنیت، گزارشات و پشتیبان', labelEn: 'Security & Backup', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    if (window.confirm(language === 'fa' ? 'آیا از خروج از پنل مدیریت اطمینان دارید؟' : 'Are you sure you want to log out?')) {
      authService.logout('Manual user logout');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#232c86] selection:text-white" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#232c86] to-indigo-600 flex items-center justify-center shadow-md border border-indigo-400/30">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white block leading-none">
                  {language === 'fa' ? 'پنل مدیریت پولاد چرخِش' : 'Polad Charkhesh Admin'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  v2.0 • Data Management Engine
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View Public Website */}
            <button
              onClick={onExitToPublicSite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'fa' ? 'مشاهده وب‌سایت' : 'View Public Site'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono border border-slate-700 transition-colors"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'fa' ? 'EN' : 'فا'}</span>
            </button>

            {/* User Profile Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
              <UserCircle className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">{currentUser?.username || 'admin'}</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                {currentUser?.role || 'superadmin'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'fa' ? 'خروج امن' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className={`
          lg:w-64 lg:block flex-shrink-0
          ${mobileMenuOpen ? 'block' : 'hidden'}
        `}>
          <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 sticky top-20 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {language === 'fa' ? 'ماژول‌های مدیریت' : 'Management Modules'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                    ${isActive 
                      ? 'bg-[#232c86] text-white shadow-md shadow-indigo-950/50 border border-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`} />
                  <span>{language === 'fa' ? item.labelFa : item.labelEn}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800/80 px-3">
              <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                {language === 'fa' 
                  ? '🔒 امنیت: رمزنگاری PBKDF2 و نشست دارای امضای HMAC.' 
                  : '🔒 Security: PBKDF2 hashing & HMAC signed sessions.'}
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
};
