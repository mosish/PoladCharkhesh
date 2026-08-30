/**
 * Polad Charkhesh Centralized Company Data & Contact Information
 * 
 * Single source of truth for company contact details, address,
 * working hours, and digital communication channels.
 */

export interface CompanyContactInfo {
  // Identity
  nameFa: string;
  nameEn: string;
  legalNameFa: string;
  legalNameEn: string;
  sloganFa: string;
  sloganEn: string;
  website: string;
  email: string;

  // Primary Phone (Mobile / Direct Management)
  primaryPhone: string;
  primaryPhoneDisplayFa: string;
  primaryPhoneDisplayEn: string;
  primaryPhoneTel: string;

  // Landline Phone (Central Office)
  landlinePhone: string;
  landlinePhoneDisplayFa: string;
  landlinePhoneDisplayEn: string;
  landlinePhoneTel: string;

  // WhatsApp
  whatsappNumber: string;
  whatsappUrl: string;

  // Address
  addressFa: string;
  addressEn: string;
  cityFa: string;
  cityEn: string;
  districtFa: string;
  districtEn: string;
  streetFa: string;
  streetEn: string;
  plate: string;

  // Working Hours
  workingHoursFa: string;
  workingHoursEn: string;
  workingHoursShortFa: string;
  workingHoursShortEn: string;

  // Map & Navigation Links
  maps: {
    google: string;
    neshan: string;
    balad: string;
  };
}

export const COMPANY_INFO: CompanyContactInfo = {
  nameFa: 'پولاد چرخِش',
  nameEn: 'PoladCharkhesh',
  legalNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  legalNameEn: 'Polad Charkhesh Industrial Trading Co.',
  sloganFa: 'تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد',
  sloganEn: 'Supply and distribution of all types of oil, mining and steel bearings',
  website: 'https://poladcharkhesh.ir',
  email: 'info@poladcharkhesh.ir',

  // Primary phone number as designated for Polad Charkhesh
  primaryPhone: '09127195313',
  primaryPhoneDisplayFa: '۰۹۱۲-۷۱۹۵۳۱۳',
  primaryPhoneDisplayEn: '0912-7195313',
  primaryPhoneTel: 'tel:+989127195313',

  // Landline central office
  landlinePhone: '02177209117',
  landlinePhoneDisplayFa: '۰۲۱-۷۷۲۰۹۱۱۷',
  landlinePhoneDisplayEn: '021-77209117',
  landlinePhoneTel: 'tel:+982177209117',

  // Official WhatsApp inquiry channel
  whatsappNumber: '+989127195313',
  whatsappUrl: 'https://wa.me/989127195313',

  // Central office & warehouse physical location
  addressFa: 'تهران، منطقه نارمک، خیابان دردشت، پلاک ۴۳۳',
  addressEn: 'No. 433, Dardasht Street, Narmak, Tehran, Iran',
  cityFa: 'تهران',
  cityEn: 'Tehran',
  districtFa: 'نارمک',
  districtEn: 'Narmak',
  streetFa: 'خیابان دردشت',
  streetEn: 'Dardasht Street',
  plate: '۴۳۳',

  // Operational schedule
  workingHoursFa: 'شنبه تا چهارشنبه: ۸:۳۰ الی ۱۸:۰۰ | پنجشنبه: ۸:۳۰ الی ۱۴:۰۰',
  workingHoursEn: 'Sat - Wed: 8:30 AM - 6:00 PM | Thu: 8:30 AM - 2:00 PM',
  workingHoursShortFa: '۸:۳۰ الی ۱۸:۰۰',
  workingHoursShortEn: '8:30 AM - 6:00 PM',

  maps: {
    google: 'https://maps.google.com/?q=35.7335,51.5125',
    neshan: 'https://nshn.ir',
    balad: 'https://balad.ir',
  },
};

/**
 * Generate a prefilled WhatsApp inquiry URL
 */
export function createWhatsAppInquiryUrl(params?: {
  productCode?: string;
  productName?: string;
  dimensions?: string;
  brands?: string[];
  customMessage?: string;
  language?: 'fa' | 'en';
}): string {
  if (!params) {
    return COMPANY_INFO.whatsappUrl;
  }

  const isFa = params.language !== 'en';

  if (params.customMessage) {
    return `${COMPANY_INFO.whatsappUrl}?text=${encodeURIComponent(params.customMessage)}`;
  }

  let text = '';
  if (isFa) {
    text = `سلام و احترام، استعلام مشخصات و موجودی قطعه زیر را از پولاد چرخِش دارم:\n`;
    if (params.productCode) text += `▫️ کد کالا: ${params.productCode}\n`;
    if (params.productName) text += `▫️ نام: ${params.productName}\n`;
    if (params.dimensions) text += `▫️ ابعاد: ${params.dimensions}\n`;
    if (params.brands && params.brands.length > 0) text += `▫️ برندهای پیشنهادی: ${params.brands.join(' / ')}\n`;
    text += `لطفاً راهنمایی بفرمایید.`;
  } else {
    text = `Hello, I would like to inquire about specifications and stock availability for:\n`;
    if (params.productCode) text += `▫️ Part Code: ${params.productCode}\n`;
    if (params.productName) text += `▫️ Name: ${params.productName}\n`;
    if (params.dimensions) text += `▫️ Dimensions: ${params.dimensions}\n`;
    if (params.brands && params.brands.length > 0) text += `▫️ Brands: ${params.brands.join(' / ')}\n`;
    text += `Please advise.`;
  }

  return `${COMPANY_INFO.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
