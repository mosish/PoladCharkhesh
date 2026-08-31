import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { CompanyInfo } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Save, 
  CheckCircle2, 
  Globe, 
  Navigation,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface AdminCompanyProps {
  language: Language;
}

export const AdminCompany: React.FC<AdminCompanyProps> = ({ language }) => {
  const isFa = language === 'fa';
  const [company, setCompany] = useState<CompanyInfo>(dataService.getCompanyInfo());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribeToCompany(setCompany);
    return () => unsub();
  }, []);

  const handleChange = <K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) => {
    setCompany((prev) => ({ ...prev, [key]: value }));
  };

  const handleNestedAddressChange = (key: string, value: string) => {
    setCompany((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [key]: value,
      },
    }));
  };

  const handleNestedHoursChange = (key: string, value: string) => {
    setCompany((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateCompanyInfo(company, 'admin');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'اطلاعات هویتی و حقوقی شرکت' : 'Company Profile & Official Identity'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'تغییر نام‌های رسمی، شماره‌های تماس، آدرس فیزیکی و ساعات کاری نمایش‌داده‌شده در وب‌سایت' 
              : 'Update public phone numbers, physical address, and working hours without code changes'}
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFa ? 'تغییرات با موفقیت ذخیره شدند.' : 'Changes saved successfully.'}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Brand & Official Names */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>{isFa ? 'نام و نشان تجاری (Brand Identity)' : 'Brand & Official Names'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'نام برند فارسی (Short Name Fa)' : 'Persian Brand Name'}
              </label>
              <input
                type="text"
                value={company.nameFa}
                onChange={(e) => handleChange('nameFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'نام برند انگلیسی (Short Name En)' : 'English Brand Name'}
              </label>
              <input
                type="text"
                value={company.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'نام کامل رسمی و حقوقی (فارسی)' : 'Official Legal Name (Fa)'}
              </label>
              <input
                type="text"
                value={company.legalNameFa}
                onChange={(e) => handleChange('legalNameFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'شعار تجاری (Slogan Fa)' : 'Slogan (Fa)'}
              </label>
              <input
                type="text"
                value={company.sloganFa}
                onChange={(e) => handleChange('sloganFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Numbers & Communication */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{isFa ? 'خطوط ارتباطی و پشتیبانی فنی' : 'Direct Contacts & Support Lines'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'تلفن همراه و مشاوره فنی (Mobile)' : 'Primary Mobile Phone'}
              </label>
              <input
                type="text"
                value={company.primaryPhone}
                onChange={(e) => handleChange('primaryPhone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'تلفن ثابت دفتر مرکزی (Landline)' : 'Office Landline'}
              </label>
              <input
                type="text"
                value={company.landlinePhone}
                onChange={(e) => handleChange('landlinePhone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'شماره واتس‌اپ استعلام (WhatsApp)' : 'WhatsApp Inquiry Number'}
              </label>
              <input
                type="text"
                value={company.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                placeholder="+98912..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address & Map Navigation */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{isFa ? 'آدرس فیزیکی دفتر مرکزی و فروشگاه' : 'Physical Address & Location'}</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'آدرس کامل (فارسی)' : 'Full Persian Address'}
              </label>
              <textarea
                value={company.address.fullAddressFa}
                onChange={(e) => handleNestedAddressChange('fullAddressFa', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'استان و شهر' : 'City / Province'}
                </label>
                <input
                  type="text"
                  value={company.address.cityFa}
                  onChange={(e) => handleNestedAddressChange('cityFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'منطقه / بازار' : 'Market District'}
                </label>
                <input
                  type="text"
                  value={company.address.districtFa}
                  onChange={(e) => handleNestedAddressChange('districtFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'خیابان اصلی' : 'Street'}
                </label>
                <input
                  type="text"
                  value={company.address.streetFa}
                  onChange={(e) => handleNestedAddressChange('streetFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'پلاک / پاساژ' : 'Building / Plate'}
                </label>
                <input
                  type="text"
                  value={company.address.plateFa}
                  onChange={(e) => handleNestedAddressChange('plateFa', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Working Hours */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{isFa ? 'ساعات کاری و پاسخگویی' : 'Working Hours'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'شنبه تا چهارشنبه (فارسی)' : 'Weekdays (Fa)'}
              </label>
              <input
                type="text"
                value={company.workingHours.weekdaysFa}
                onChange={(e) => handleNestedHoursChange('weekdaysFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isFa ? 'پنج‌شنبه‌ها (فارسی)' : 'Thursdays (Fa)'}
              </label>
              <input
                type="text"
                value={company.workingHours.thursdaysFa}
                onChange={(e) => handleNestedHoursChange('thursdaysFa', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{isFa ? 'ذخیره مشخصات هویتی شرکت' : 'Save Company Profile'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
