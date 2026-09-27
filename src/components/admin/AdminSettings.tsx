import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { CompanyContactInfo, StructuredWorkingHours, generateWorkingHoursStrings, SocialLinkItem } from '../../data/company';
import { dataService } from '../../services/dataService';
import { 
  Building2, 
  Phone, 
  Clock, 
  Globe, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Radio,
  Share2,
  CalendarCheck
} from 'lucide-react';

export type SettingsSubTab = 'company' | 'contact' | 'hours' | 'global';

interface AdminSettingsProps {
  language: Language;
  initialSubTab?: SettingsSubTab;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  language, 
  initialSubTab = 'company' 
}) => {
  const isFa = language === 'fa';
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);
  const [formData, setFormData] = useState<CompanyContactInfo>(dataService.getCompanyInfo());
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Repeatable landline phone input state
  const [newLandlineInput, setNewLandlineInput] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribeToCompany((updated) => {
      setFormData(updated);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleChange = <K extends keyof CompanyContactInfo>(key: K, value: CompanyContactInfo[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      
      // Auto-sync bidirectional aliases
      if (key === 'companyNameFa') next.nameFa = value as string;
      if (key === 'nameFa') next.companyNameFa = value as string;
      if (key === 'companyNameEn') next.nameEn = value as string;
      if (key === 'nameEn') next.companyNameEn = value as string;
      if (key === 'taglineFa') next.sloganFa = value as string;
      if (key === 'sloganFa') next.taglineFa = value as string;
      if (key === 'taglineEn') next.sloganEn = value as string;
      if (key === 'sloganEn') next.taglineEn = value as string;
      if (key === 'officeAddressFa') next.addressFa = value as string;
      if (key === 'addressFa') next.officeAddressFa = value as string;
      if (key === 'officeAddressEn') next.addressEn = value as string;
      if (key === 'addressEn') next.officeAddressEn = value as string;
      if (key === 'primaryMobile') next.primaryPhone = value as string;
      if (key === 'primaryPhone') next.primaryMobile = value as string;
      if (key === 'inquiryEmail') next.email = value as string;
      if (key === 'email') next.inquiryEmail = value as string;

      return next;
    });
  };

  const handleWorkingHoursConfigChange = (key: keyof StructuredWorkingHours, value: any) => {
    setFormData((prev) => {
      const currentConfig = prev.workingHoursConfig || {
        workDaysFa: 'شنبه تا چهارشنبه',
        workDaysEn: 'Sat - Wed',
        openTime: '08:00',
        closeTime: '16:00',
        hasThursdayHours: false,
        thursdayOpenTime: '08:00',
        thursdayCloseTime: '13:00',
        closedDaysFa: 'پنج‌شنبه و جمعه: تعطیل',
        closedDaysEn: 'Thu & Fri: Closed',
      };

      const updatedConfig = { ...currentConfig, [key]: value };
      const generated = generateWorkingHoursStrings(updatedConfig);

      return {
        ...prev,
        workingHoursConfig: updatedConfig,
        workingHoursFa: generated.workingHoursFa,
        workingHoursEn: generated.workingHoursEn,
        workingHoursShortFa: generated.workingHoursShortFa,
        workingHoursShortEn: generated.workingHoursShortEn,
      };
    });
  };

  const handleAddLandline = () => {
    const clean = newLandlineInput.trim();
    if (!clean) return;

    const currentList = Array.isArray(formData.landlinePhones) ? [...formData.landlinePhones] : [];
    if (!currentList.includes(clean)) {
      currentList.push(clean);
      setFormData((prev) => ({
        ...prev,
        landlinePhones: currentList,
        landlinePhone: prev.landlinePhone || clean,
      }));
    }
    setNewLandlineInput('');
  };

  const handleRemoveLandline = (indexToRemove: number) => {
    const currentList = Array.isArray(formData.landlinePhones) ? [...formData.landlinePhones] : [];
    currentList.splice(indexToRemove, 1);
    setFormData((prev) => ({
      ...prev,
      landlinePhones: currentList,
      landlinePhone: currentList[0] || '',
    }));
  };

  const handleSocialLinkToggle = (index: number) => {
    const links = formData.socialLinks ? [...formData.socialLinks] : [];
    if (links[index]) {
      links[index].enabled = !links[index].enabled;
      setFormData((prev) => ({ ...prev, socialLinks: links }));
    }
  };

  const handleSocialLinkUrlChange = (index: number, url: string) => {
    const links = formData.socialLinks ? [...formData.socialLinks] : [];
    if (links[index]) {
      links[index].url = url;
      setFormData((prev) => ({ ...prev, socialLinks: links }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await dataService.updateCompanyInfo(formData, 'admin');
      if (res.success) {
        setSuccessMessage(
          isFa
            ? 'تنظیمات با موفقیت در پایگاه داده سرور ذخیره و اعمال شد.'
            : 'Settings successfully saved and synchronized across website.'
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(
          isFa
            ? 'خطا در ذخیره‌سازی اطلاعات. لطفاً مقادیر ورودی را بررسی نمایید.'
            : 'Failed to update settings. Please check your inputs.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطای غیرمنتظره در سرور');
    } finally {
      setIsSaving(false);
    }
  };

  const subTabNav = [
    {
      id: 'company' as SettingsSubTab,
      labelFa: 'اطلاعات هویتی شرکت',
      labelEn: 'Company Identity',
      icon: Building2,
      descFa: 'نام‌های برند، نام حقوقی، آدرس دفتر و شعار تجاری',
      descEn: 'Brand names, legal identity, address & taglines',
    },
    {
      id: 'contact' as SettingsSubTab,
      labelFa: 'ارتباطات و خطوط تماس',
      labelEn: 'Contact & Communication',
      icon: Phone,
      descFa: 'موبایل، خطوط تلفن ثابت، واتس‌اپ و ایمیل‌ها',
      descEn: 'Mobiles, repeatable landlines, WhatsApp & emails',
    },
    {
      id: 'hours' as SettingsSubTab,
      labelFa: 'ساعات کاری و پاسخگویی',
      labelEn: 'Working Hours',
      icon: Clock,
      descFa: 'برنامه زمان‌بندی ساختاریافته و پیش‌نمایش دوزبانه',
      descEn: 'Structured business schedule & bilingual preview',
    },
    {
      id: 'global' as SettingsSubTab,
      labelFa: 'تنظیمات سراسری وب‌سایت',
      labelEn: 'Global Website Settings',
      icon: Globe,
      descFa: 'زبان پیش‌فرض، نمایش دکمه‌ها و نوار اعلان‌ها',
      descEn: 'Default language, CTA visibility & announcement bar',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Control Center Overview */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'مرکز مدیریت و تنظیمات وب‌سایت' : 'Website Control Center & Settings'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'مدیریت متمرکز هویت سازمانی، خطوط ارتباطی، ساعات کاری و تنظیمات کلی سایت (CMS Backed)' 
              : 'Centrally manage company profile, phone lines, working schedule and global website features'}
          </p>
        </div>

        {/* Global Save Button at Top for Easy Access */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? (isFa ? 'در حال ذخیره‌سازی...' : 'Saving...') : (isFa ? 'ذخیره تمام تغییرات' : 'Save All Changes')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Sub-tab Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {subTabNav.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {isFa ? tab.labelFa : tab.labelEn}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed truncate">
                {isFa ? tab.descFa : tab.descEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ======================================================== */}
        {/* SUBTAB 1: COMPANY INFORMATION                            */}
        {/* ======================================================== */}
        {activeSubTab === 'company' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Brand Names & Legal Identity */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'نام و نشان تجاری شرکت (Brand & Legal Identity)' : 'Brand & Legal Identity'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام برند فارسی (companyNameFa)' : 'Persian Brand Name (companyNameFa)'}
                    <span className="text-rose-400 mr-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyNameFa || formData.nameFa || ''}
                    onChange={(e) => handleChange('companyNameFa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {isFa ? 'نام اصلی نمایش داده شده در هدر، فوتر و متاتگ‌های فارسی' : 'Primary display name for Persian UI'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام برند انگلیسی (companyNameEn)' : 'English Brand Name (companyNameEn)'}
                    <span className="text-rose-400 mr-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyNameEn || formData.nameEn || ''}
                    onChange={(e) => handleChange('companyNameEn', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {isFa ? 'نام انگلیسی مورد استفاده در دامنه .com و متاتگ‌های بین‌المللی' : 'Display name for English domain and international meta tags'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام رسمی حقوقی فارسی (legalNameFa)' : 'Official Legal Name Fa (legalNameFa)'}
                  </label>
                  <input
                    type="text"
                    value={formData.legalNameFa || ''}
                    onChange={(e) => handleChange('legalNameFa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'نام رسمی حقوقی انگلیسی (legalNameEn)' : 'Official Legal Name En (legalNameEn)'}
                  </label>
                  <input
                    type="text"
                    value={formData.legalNameEn || ''}
                    onChange={(e) => handleChange('legalNameEn', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'شعار تجاری فارسی (taglineFa)' : 'Persian Tagline (taglineFa)'}
                  </label>
                  <input
                    type="text"
                    value={formData.taglineFa || formData.sloganFa || ''}
                    onChange={(e) => handleChange('taglineFa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'شعار تجاری انگلیسی (taglineEn)' : 'English Tagline (taglineEn)'}
                  </label>
                  <input
                    type="text"
                    value={formData.taglineEn || formData.sloganEn || ''}
                    onChange={(e) => handleChange('taglineEn', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Physical Address & Location */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{isFa ? 'نشانی دفتر مرکزی و انبار (Office Address)' : 'Office & Warehouse Physical Address'}</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'نشانی کامل فارسی (officeAddressFa)' : 'Full Persian Address (officeAddressFa)'}
                      <span className="text-rose-400 mr-1">*</span>
                    </label>
                    <textarea
                      value={formData.officeAddressFa || formData.addressFa || ''}
                      onChange={(e) => handleChange('officeAddressFa', e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'نشانی کامل انگلیسی (officeAddressEn)' : 'Full English Address (officeAddressEn)'}
                      <span className="text-rose-400 mr-1">*</span>
                    </label>
                    <textarea
                      value={formData.officeAddressEn || formData.addressEn || ''}
                      onChange={(e) => handleChange('officeAddressEn', e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed font-sans"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFa ? 'استان و شهر' : 'City / Province'}
                    </label>
                    <input
                      type="text"
                      value={formData.cityFa || ''}
                      onChange={(e) => handleChange('cityFa', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFa ? 'منطقه / محله' : 'District'}
                    </label>
                    <input
                      type="text"
                      value={formData.districtFa || ''}
                      onChange={(e) => handleChange('districtFa', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFa ? 'خیابان اصلی' : 'Street'}
                    </label>
                    <input
                      type="text"
                      value={formData.streetFa || ''}
                      onChange={(e) => handleChange('streetFa', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFa ? 'پلاک / کد پستی' : 'Plate / Postal Code'}
                    </label>
                    <input
                      type="text"
                      value={formData.plate || ''}
                      onChange={(e) => handleChange('plate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 2: CONTACT & COMMUNICATION                        */}
        {/* ======================================================== */}
        {activeSubTab === 'contact' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Primary & Secondary Mobiles */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'خطوط تلفن همراه و مدیریت فروش' : 'Mobile Communication Lines'}</span>
                </span>
                
                {/* Direct Phone Toggle */}
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.phoneEnabled !== false}
                    onChange={(e) => handleChange('phoneEnabled', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>{isFa ? 'فعال بودن تماس تلفنی در سایت' : 'Enable Direct Calling CTA'}</span>
                </label>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'موبایل اصلی / مدیریت فروش (Primary Mobile)' : 'Primary Mobile / Sales Line'}
                    <span className="text-rose-400 mr-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.primaryMobile || formData.primaryPhone || ''}
                    onChange={(e) => handleChange('primaryMobile', e.target.value)}
                    placeholder="09127195313"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                    <span>پیش‌نمایش فارسی: {formData.primaryPhoneDisplayFa}</span>
                    <span>انگلیسی: {formData.primaryPhoneDisplayEn}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'موبایل ثانویه / پشتیبانی (Secondary Mobile - اختیاری)' : 'Secondary Mobile (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryMobile || ''}
                    onChange={(e) => handleChange('secondaryMobile', e.target.value)}
                    placeholder="0912xxxxxxx"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {isFa ? 'جهت خط رزرو مشاوران فنی در ایام پیک' : 'Backup mobile line for technical inquiries'}
                  </span>
                </div>
              </div>
            </div>

            {/* Repeatable Landline Phones */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  <span>{isFa ? 'تلفن‌های ثابت دفتر مرکزی (Repeatable Landlines)' : 'Office Landline Numbers'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formData.landlinePhones?.length || 0} {isFa ? 'خط ثبت شده' : 'lines'}
                </span>
              </h3>

              {/* Add New Landline Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLandlineInput}
                  onChange={(e) => setNewLandlineInput(e.target.value)}
                  placeholder={isFa ? 'مثال: 02177209117' : 'e.g. 02177209117'}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddLandline}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFa ? 'افزودن خط تلفن' : 'Add Line'}</span>
                </button>
              </div>

              {/* Landline List Cards */}
              <div className="space-y-2">
                {(formData.landlinePhones || [formData.landlinePhone]).map((phoneNum, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-white font-mono font-semibold">{phoneNum}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          {isFa ? 'خط اصلی دفتر' : 'Primary Line'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLandline(idx)}
                      disabled={(formData.landlinePhones?.length || 0) <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title={isFa ? 'حذف این خط' : 'Remove Line'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Integration */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'پیکربندی کانال واتس‌اپ رسمی (WhatsApp)' : 'Official WhatsApp Channel'}</span>
                </span>

                {/* WhatsApp Enabled Toggle */}
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.whatsappEnabled !== false}
                    onChange={(e) => handleChange('whatsappEnabled', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="font-semibold">{isFa ? 'فعال بودن دکمه‌های واتس‌اپ' : 'WhatsApp Channel Enabled'}</span>
                </label>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'شماره واتس‌اپ (با پیش‌شماره بین‌المللی):' : 'WhatsApp Number (Intl format):'}
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="+989127195313"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'لینک مستقیم هدایت به واتس‌اپ (تولید خودکار):' : 'Generated WhatsApp Target Link:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.whatsappUrl || 'https://wa.me/989127195313'}
                      className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono truncate"
                    />
                    <a
                      href={formData.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title={isFa ? 'تست لینک' : 'Test Link'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Accounts */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>{isFa ? 'پست‌های الکترونیکی رسمی (Official Emails)' : 'Official Email Accounts'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ایمیل عمومی و استعلامات (inquiryEmail)' : 'General Inquiry Email (inquiryEmail)'}
                  </label>
                  <input
                    type="email"
                    value={formData.inquiryEmail || formData.email || ''}
                    onChange={(e) => handleChange('inquiryEmail', e.target.value)}
                    placeholder="info@poladcharkhesh.ir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ایمیل واحد مهندسی و فنی (technicalEmail)' : 'Technical Engineering Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.technicalEmail || ''}
                    onChange={(e) => handleChange('technicalEmail', e.target.value)}
                    placeholder="tech@poladcharkhesh.ir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Channels */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>{isFa ? 'شبکه‌های اجتماعی و ارتباطی سازمانی' : 'Corporate Social Channels'}</span>
              </h3>

              <div className="space-y-3">
                {(formData.socialLinks || []).map((item, sIdx) => (
                  <div key={sIdx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleSocialLinkToggle(sIdx)}
                        className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-slate-200">{isFa ? item.titleFa : item.titleEn}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">({item.platform})</span>
                    </div>

                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => handleSocialLinkUrlChange(sIdx, e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 3: WORKING HOURS                                  */}
        {/* ======================================================== */}
        {activeSubTab === 'hours' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Structured Business Hours Configuration */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'پیکربندی ساختاریافته ساعات کاری (Structured Business Schedule)' : 'Structured Business Hours'}</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">
                  BILINGUAL AUTO-GENERATOR
                </span>
              </div>

              {/* Working Hours Config Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'روزهای کاری (فارسی):' : 'Work Days (Fa):'}
                  </label>
                  <input
                    type="text"
                    value={formData.workingHoursConfig?.workDaysFa || 'شنبه تا چهارشنبه'}
                    onChange={(e) => handleWorkingHoursConfigChange('workDaysFa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'روزهای کاری (انگلیسی):' : 'Work Days (En):'}
                  </label>
                  <input
                    type="text"
                    value={formData.workingHoursConfig?.workDaysEn || 'Sat - Wed'}
                    onChange={(e) => handleWorkingHoursConfigChange('workDaysEn', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ساعت شروع کار (Open Time):' : 'Opening Time:'}
                  </label>
                  <input
                    type="time"
                    value={formData.workingHoursConfig?.openTime || '08:00'}
                    onChange={(e) => handleWorkingHoursConfigChange('openTime', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'ساعت پایان کار (Close Time):' : 'Closing Time:'}
                  </label>
                  <input
                    type="time"
                    value={formData.workingHoursConfig?.closeTime || '16:00'}
                    onChange={(e) => handleWorkingHoursConfigChange('closeTime', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Thursday Working Hours Option */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasThursdayHoursCheck"
                    checked={Boolean(formData.workingHoursConfig?.hasThursdayHours)}
                    onChange={(e) => handleWorkingHoursConfigChange('hasThursdayHours', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="hasThursdayHoursCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    {isFa ? 'دفتر در روزهای پنج‌شنبه نیز باز است (ساعات کاری نیمه‌وقت)' : 'Enable Thursday half-day business hours'}
                  </label>
                </div>

                {formData.workingHoursConfig?.hasThursdayHours && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 rtl:pr-6 rtl:pl-0">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        {isFa ? 'ساعت بازگشایی پنج‌شنبه:' : 'Thursday Open:'}
                      </label>
                      <input
                        type="time"
                        value={formData.workingHoursConfig?.thursdayOpenTime || '08:00'}
                        onChange={(e) => handleWorkingHoursConfigChange('thursdayOpenTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        {isFa ? 'ساعت خاتمه پنج‌شنبه:' : 'Thursday Close:'}
                      </label>
                      <input
                        type="time"
                        value={formData.workingHoursConfig?.thursdayCloseTime || '13:00'}
                        onChange={(e) => handleWorkingHoursConfigChange('thursdayCloseTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Closed Days Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'پیام روزهای تعطیل (فارسی):' : 'Closed Days Message (Fa):'}
                  </label>
                  <input
                    type="text"
                    value={formData.workingHoursConfig?.closedDaysFa || 'پنج‌شنبه و جمعه: تعطیل'}
                    onChange={(e) => handleWorkingHoursConfigChange('closedDaysFa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'پیام روزهای تعطیل (انگلیسی):' : 'Closed Days Message (En):'}
                  </label>
                  <input
                    type="text"
                    value={formData.workingHoursConfig?.closedDaysEn || 'Thu & Fri: Closed'}
                    onChange={(e) => handleWorkingHoursConfigChange('closedDaysEn', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Live Bilingual Output Preview Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'پیش‌نمایش خروجی‌های خودکار در وب‌سایت و سئو' : 'Live Generated Public Outputs Preview'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Persian Preview */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">خروجی کامل فارسی (workingHoursFa)</span>
                    <span className="text-[10px] font-mono text-indigo-400">FA-IR</span>
                  </div>
                  <p className="text-sm font-bold text-indigo-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    {formData.workingHoursFa}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>فرمت کوتاه هدر:</span>
                    <span className="font-mono font-semibold text-slate-300">{formData.workingHoursShortFa}</span>
                  </div>
                </div>

                {/* English Preview */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Full English Output (workingHoursEn)</span>
                    <span className="text-[10px] font-mono text-indigo-400">EN-US</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-indigo-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    {formData.workingHoursEn}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Short Navbar Format:</span>
                    <span className="font-mono font-semibold text-slate-300">{formData.workingHoursShortEn}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 4: GLOBAL WEBSITE SETTINGS                        */}
        {/* ======================================================== */}
        {activeSubTab === 'global' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Language Architecture */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>{isFa ? 'معماری و رفتار پیش‌فرض زبان وب‌سایت (Language Architecture)' : 'Default Language Architecture'}</span>
              </h3>

              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa 
                    ? 'پلتفرم پولاد چرخِش از معماری دامنه‌ای بهره می‌برد؛ دامنه poladcharkhesh.ir به صورت پیش‌فرض فارسی و دامنه poladcharkhesh.com به صورت پیش‌فرض انگلیسی بارگذاری می‌شود.' 
                    : 'Polad Charkhesh operates dual-domain architecture: .ir domain serves Persian first, and .com serves English first.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    (formData.defaultLanguage || 'domain_based') === 'domain_based'
                      ? 'bg-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="defaultLanguage"
                      value="domain_based"
                      checked={(formData.defaultLanguage || 'domain_based') === 'domain_based'}
                      onChange={() => handleChange('defaultLanguage', 'domain_based')}
                      className="mt-0.5 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">{isFa ? 'هوشمند بر اساس دامنه' : 'Domain-Based'}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">.ir ➔ Fa / .com ➔ En</span>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    formData.defaultLanguage === 'fa'
                      ? 'bg-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="defaultLanguage"
                      value="fa"
                      checked={formData.defaultLanguage === 'fa'}
                      onChange={() => handleChange('defaultLanguage', 'fa')}
                      className="mt-0.5 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">{isFa ? 'پیش‌فرض فارسی' : 'Always Persian'}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Persian-first across all hosts</span>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    formData.defaultLanguage === 'en'
                      ? 'bg-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="defaultLanguage"
                      value="en"
                      checked={formData.defaultLanguage === 'en'}
                      onChange={() => handleChange('defaultLanguage', 'en')}
                      className="mt-0.5 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">{isFa ? 'پیش‌فرض انگلیسی' : 'Always English'}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">English-first across all hosts</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Visibility & CTA Switches */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'کنترل نمایش المان‌های تعاملی و دکمه‌های استعلام (CTA Visibility)' : 'Interactive CTAs Visibility'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Contact CTA in Nav & Hero */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isFa ? 'دکمه استعلام و مشاوره فنی (Contact CTA)' : 'Contact Consultation CTA'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isFa ? 'نمایش دکمه مشاوره مهندسی در هدر و هیرو' : 'Show technical consultation CTA in top bar & hero'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.contactCtaEnabled !== false}
                    onChange={(e) => handleChange('contactCtaEnabled', e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Floating Quick Action Hub */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isFa ? 'دکمه‌های شناور پایین صفحه (Floating Actions)' : 'Floating Actions Hub'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isFa ? 'دکمه‌های شناور تماس سریع و واتس‌اپ در گوشه صفحه' : 'Floating quick call & WhatsApp shortcuts'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.showFloatingActions !== false}
                    onChange={(e) => handleChange('showFloatingActions', e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-5 h-5 cursor-pointer"
                  />
                </div>

              </div>
            </div>

            {/* Top Bar Announcement */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'نوار اعلان‌های بالای سایت (Top Announcement Bar)' : 'Header Announcement Bar'}</span>
                </span>
                
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showTopAnnouncement !== false}
                    onChange={(e) => handleChange('showTopAnnouncement', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>{isFa ? 'نمایش نوار اعلان در بالای صفحه' : 'Show Announcement'}</span>
                </label>
              </h3>

              {formData.showTopAnnouncement !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'متن اعلان به فارسی (announcementTextFa):' : 'Announcement Text (Fa):'}
                    </label>
                    <textarea
                      value={formData.announcementTextFa || ''}
                      onChange={(e) => handleChange('announcementTextFa', e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFa ? 'متن اعلان به انگلیسی (announcementTextEn):' : 'Announcement Text (En):'}
                    </label>
                    <textarea
                      value={formData.announcementTextEn || ''}
                      onChange={(e) => handleChange('announcementTextEn', e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preparation for Phase 7.3 Foundation Notice */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono">
              {isFa 
                ? 'ℹ️ این ساختار، بستر پایه برای Phase 7.3 (مدیریت محتوای هیرو، مزایا، صنایع و اعضای تیم) را بدون دستکاری ساختار کاتالوگ مهندسی ۶۸ کالا فراهم ساخته است.' 
                : 'ℹ️ Clean foundation established for Phase 7.3 (Hero, Benefits, Industries & Team CMS) without altering the 68 canonical bearing engineering specs.'}
            </div>

          </div>
        )}

        {/* Global Save Button at Bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            {isFa 
              ? 'تغییرات بلافاصله پس از ذخیره در تمامی بخش‌های سایت به‌روزرسانی می‌شوند.' 
              : 'Updates immediately propagate across all website components upon saving.'}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? (isFa ? 'در حال ذخیره‌سازی...' : 'Saving...') : (isFa ? 'ذخیره تنظیمات وب‌سایت' : 'Save Website Settings')}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
