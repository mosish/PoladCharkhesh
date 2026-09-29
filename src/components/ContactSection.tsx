import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { dataService, useCompanyInfo, usePageContent } from '../services/dataService';
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  Send, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Sparkles
} from 'lucide-react';

interface ContactSectionProps {
  language: Language;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ language }) => {
  const company = useCompanyInfo();
  const contactContent = usePageContent().contact;
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    partList: '',
    urgency: 'normal',
  });

  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.partList.trim()) {
      setFormError(
        language === 'fa'
          ? 'لطفاً نام، شماره تماس و جزئیات پیام را تکمیل فرمایید.'
          : 'Please complete your name, phone number, and project inquiry details.'
      );
      return;
    }
    setFormError('');
    
    const result = await dataService.recordInquiry({
      fullName: `${formData.name} (${formData.company || 'شخصی'})`,
      phone: formData.phone,
      message: `[فوریت: ${formData.urgency}] ${formData.partList}`,
      company: formData.company,
      email: formData.email,
    });

    if (!result.success) {
      setFormError(
        language === 'fa'
          ? 'ثبت پیام روی سرور انجام نشد. لطفاً دوباره تلاش کنید یا مستقیماً تماس بگیرید.'
          : 'The inquiry could not be saved on the server. Please retry or contact us directly.'
      );
      return;
    }

    setSubmitted(true);
  };

  const getWhatsAppInquiryUrl = () => {
    const text = language === 'fa'
      ? `درخواست تماس و مشاوره فنی بازرگانی پولاد چرخِش:\n` +
        `👤 نام: ${formData.name || 'نامشخص'}\n` +
        `🏢 شرکت/کارخانه: ${formData.company || 'شخصی'}\n` +
        `📞 تلفن: ${formData.phone || 'نامشخص'}\n` +
        `⚡ فوریت: ${formData.urgency}\n` +
        `⚙️ جزئیات استعلام:\n${formData.partList || 'استعلام عمومی کاتالوگ'}`
      : `PoladCharkhesh Technical Inquiry & Consultation Request:\n` +
        `👤 Name: ${formData.name || 'N/A'}\n` +
        `🏢 Company: ${formData.company || 'Individual'}\n` +
        `📞 Phone: ${formData.phone || 'N/A'}\n` +
        `⚡ Urgency: ${formData.urgency}\n` +
        `⚙️ Inquired Parts/Details:\n${formData.partList || 'General Inquiry'}`;
    
    const baseUrl = company.whatsappUrl;
    if (!baseUrl) return '#';
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="contact" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="eyebrow mb-3">
            <span />
            <Phone className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>{language === 'fa' ? contactContent.tagFa : contactContent.tagEn}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight">
            {language === 'fa' ? contactContent.titleFa : contactContent.titleEn}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-300">
            {language === 'fa' ? contactContent.subtitleFa : contactContent.subtitleEn}
          </p>
        </div>

        {/* 2-Column Grid: Contact Information Cards + Direct Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card (Liquid Glass Panel) */}
            <div className="panel p-6 sm:p-8 rounded-3xl space-y-6 text-white">
              <h3 className="text-base sm:text-lg font-bold text-white border-b border-white/10 pb-4">
                {language === 'fa' ? contactContent.infoTitleFa : contactContent.infoTitleEn}
              </h3>

              <div className="space-y-4">
                {/* Landline */}
                {company.phoneEnabled !== false && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="p-3 rounded-2xl bg-white/10 text-[#95bee8] flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">{t.contact.info.phoneLabel}</span>
                      <a
                        href={company.landlinePhoneTel}
                        className="text-base sm:text-lg font-bold font-mono text-[#c9e8ff] hover:text-white transition-colors"
                      >
                        {language === 'fa' ? (company.landlinePhoneDisplayFa || company.landlinePhone) : (company.landlinePhoneDisplayEn || company.landlinePhone)}
                      </a>
                    </div>
                  </div>
                )}

                {/* Mobile & WhatsApp */}
                {company.whatsappEnabled !== false && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
                    <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 flex-shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">{t.contact.info.mobileLabel}</span>
                      <a
                        href={company.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base sm:text-lg font-bold font-mono text-emerald-400 hover:underline"
                      >
                        {language === 'fa' ? (company.primaryPhoneDisplayFa || company.primaryPhone) : (company.primaryPhoneDisplayEn || company.primaryPhone)}
                      </a>
                    </div>
                  </div>
                )}

                {/* Hours */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="p-3 rounded-2xl bg-white/10 text-slate-300 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">{t.contact.info.hoursLabel}</span>
                    <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">
                      {language === 'fa' ? company.workingHoursFa : company.workingHoursEn}
                    </p>
                  </div>
                </div>

                {/* Email */}
                {(company.inquiryEmail || company.email) && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="p-3 rounded-2xl bg-white/10 text-sky-400 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">
                        {language === 'fa' ? 'پست الکترونیکی استعلام:' : 'Inquiry Email:'}
                      </span>
                      <a
                        href={`mailto:${company.inquiryEmail || company.email}`}
                        className="text-xs sm:text-sm font-bold font-mono text-[#c9e8ff] hover:underline"
                      >
                        {company.inquiryEmail || company.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Promise */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#192b42] to-[#0d1826] text-white space-y-2 border border-white/15">
                <div className="flex items-center gap-2 font-bold text-xs text-[#c9e8ff]">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{language === 'fa' ? 'مشاوره فنی و استعلام تلفنی فوری' : 'Instant Technical & Supply Consultation'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                  {language === 'fa' 
                    ? 'کارشناسان ما آماده پاسخگویی به استعلامات فنی، معادل‌سازی کدها و ارائه مشاوره‌های روانکاری تخصصی هستند.'
                    : 'Our engineering team is ready to assist with cross-referencing, lubricant calculations, and technical bearings specs.'}
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Direct Contact & Inquiry Form (Liquid Glass Panel) */}
          <div className="lg:col-span-7 panel p-6 sm:p-8 rounded-3xl text-white">
            <div className="border-b border-white/10 pb-4 mb-6 text-start">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {language === 'fa' ? contactContent.formTitleFa : contactContent.formTitleEn}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'fa' ? contactContent.formSubtitleFa : contactContent.formSubtitleEn}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-emerald-400">
                  {t.contact.form.successTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
                  {t.contact.form.successMsg}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <a
                    href={getWhatsAppInquiryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button primary inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.contact.form.submitWhatsapp}</span>
                  </a>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', company: '', phone: '', email: '', partList: '', urgency: 'normal' });
                    }}
                    className="button px-5 py-3 rounded-full text-xs font-semibold"
                  >
                    {t.contact.form.sendAnother}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                {formError && (
                  <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t.contact.form.name} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.contact.form.namePlaceholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#95bee8] rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t.contact.form.company}
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder={t.contact.form.companyPlaceholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#95bee8] rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t.contact.form.phone} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.contact.form.phonePlaceholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#95bee8] rounded-xl text-xs font-mono text-white placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t.contact.form.email}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.contact.form.emailPlaceholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#95bee8] rounded-xl text-xs font-mono text-white placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Urgency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t.contact.form.urgency}
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full py-3 px-4 bg-[#101e31] border border-white/15 focus:border-[#95bee8] rounded-xl text-xs text-white focus:outline-none transition-all"
                  >
                    <option value="urgent">{t.contact.form.urgencies.urgent}</option>
                    <option value="normal">{t.contact.form.urgencies.normal}</option>
                    <option value="quoteOnly">{t.contact.form.urgencies.quoteOnly}</option>
                  </select>
                </div>

                {/* Part List Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t.contact.form.partList} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.partList}
                    onChange={(e) => setFormData({ ...formData, partList: e.target.value })}
                    placeholder={t.contact.form.partListPlaceholder}
                    className="w-full p-4 bg-white/5 border border-white/15 focus:border-[#95bee8] rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>

                {/* Buttons: Direct Submit & WhatsApp Quick Dispatch */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="submit-contact-form-btn"
                    type="submit"
                    className="w-full sm:flex-1 button primary flex items-center justify-center gap-2 py-3 px-6 rounded-full text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.contact.form.submitBtn}</span>
                  </button>

                  <a
                    id="submit-whatsapp-form-btn"
                    href={getWhatsAppInquiryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.contact.form.submitWhatsapp}</span>
                  </a>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
export default ContactSection;
