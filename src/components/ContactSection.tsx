import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { COMPANY_INFO } from '../data/company';
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  Send, 
  CheckCircle2, 
  Building2, 
  Mail, 
  User, 
  Sparkles
} from 'lucide-react';

interface ContactSectionProps {
  language: Language;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ language }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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
    
    return `${COMPANY_INFO.whatsappUrl}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="contact" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Phone className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{t.contact.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.contact.title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            {t.contact.subtitle}
          </p>
        </div>

        {/* 2-Column Grid: Contact Information Cards + Direct Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card (Apple Liquid Glass) */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-200/60 pb-4">
                {t.contact.infoTitle}
              </h3>

              <div className="space-y-4">
                {/* Landline */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/15">
                  <div className="p-3 rounded-2xl bg-blue-500/15 text-[#232c86] flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">{t.contact.info.phoneLabel}</span>
                    <a
                      href="tel:02177209117"
                      className="text-base sm:text-lg font-black font-mono-spec text-slate-900 hover:text-[#232c86] transition-colors"
                    >
                      {t.contact.info.phoneDisplay}
                    </a>
                  </div>
                </div>

                {/* Mobile & WhatsApp */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
                  <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700 flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">{t.contact.info.mobileLabel}</span>
                    <a
                      href="https://wa.me/989127195313"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-black font-mono-spec text-emerald-700 hover:underline"
                    >
                      {t.contact.info.mobileDisplay}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-100/60 border border-white/80">
                  <div className="p-3 rounded-2xl bg-white text-slate-700 flex-shrink-0 shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">{t.contact.info.hoursLabel}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {t.contact.info.hoursValue}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consultation Promise (Liquid Glass Highlight) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#232c86] to-[#171e5c] text-white space-y-2 shadow-lg shadow-blue-950/20 border border-white/10">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{language === 'fa' ? 'مشاوره فنی و استعلام تلفنی فوری' : 'Instant Technical & Supply Consultation'}</span>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed font-normal">
                  {language === 'fa' 
                    ? 'کارشناسان ما آماده پاسخگویی به استعلامات فنی، معادل‌سازی کدها و ارائه مشاوره‌های روانکاری تخصصی هستند.'
                    : 'Our engineering team is ready to assist with cross-referencing, lubricant calculations, and technical bearings specs.'}
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Direct Contact & Inquiry Form (Apple Liquid Glass) */}
          <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl">
            <div className="border-b border-slate-200/60 pb-4 mb-6 text-start">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {t.contact.formTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t.contact.formSub}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900">
                  {t.contact.submittedTitle}
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  {t.contact.form.successMsg}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <a
                    href={getWhatsAppInquiryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.contact.sendWhatsAppCopy}</span>
                  </a>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', company: '', phone: '', email: '', partList: '', urgency: 'normal' });
                    }}
                    className="px-5 py-3 rounded-full glass-btn-secondary text-xs font-semibold text-slate-700"
                  >
                    {t.contact.newInquiry}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                {formError && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.contact.form.name} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t.contact.form.namePlaceholder}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.contact.form.company}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder={t.contact.form.companyPlaceholder}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.contact.form.phone} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t.contact.form.phonePlaceholder}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs font-mono-spec text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.contact.form.email}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t.contact.form.emailPlaceholder}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs font-mono-spec text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Urgency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.contact.form.urgency}
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full py-3 px-4 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <option value="urgent">{t.contact.form.urgencies.urgent}</option>
                    <option value="normal">{t.contact.form.urgencies.normal}</option>
                    <option value="quoteOnly">{t.contact.form.urgencies.quoteOnly}</option>
                  </select>
                </div>

                {/* Part List Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.contact.form.partList} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.partList}
                    onChange={(e) => setFormData({ ...formData, partList: e.target.value })}
                    placeholder={t.contact.form.partListPlaceholder}
                    className="w-full p-4 bg-white/70 backdrop-blur-sm border border-slate-200/80 focus:border-[#232c86] focus:bg-white rounded-2xl text-xs text-slate-900 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                </div>

                {/* Buttons: Direct Submit & WhatsApp Quick Dispatch */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="submit-contact-form-btn"
                    type="submit"
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full glass-btn-primary text-xs sm:text-sm shadow-md shadow-blue-900/20"
                  >
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>{t.contact.form.submitBtn}</span>
                  </button>

                  <a
                    id="submit-whatsapp-form-btn"
                    href={getWhatsAppInquiryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.contact.whatsappBtn}</span>
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

