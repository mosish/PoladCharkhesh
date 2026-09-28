/**
 * Polad Charkhesh Centralized Company Data & Contact Information
 * 
 * Single source of truth for company contact details, address,
 * working hours, and digital communication channels.
 */

export interface StructuredWorkingHours {
  workDaysFa: string;        // e.g. 'شنبه تا چهارشنبه'
  workDaysEn: string;        // e.g. 'Sat - Wed'
  openTime: string;          // e.g. '08:00'
  closeTime: string;         // e.g. '16:00'
  hasThursdayHours: boolean; // e.g. false
  thursdayOpenTime?: string; // e.g. '08:00'
  thursdayCloseTime?: string;// e.g. '13:00'
  closedDaysFa: string;      // e.g. 'پنج‌شنبه و جمعه: تعطیل'
  closedDaysEn: string;      // e.g. 'Thu & Fri: Closed'
}

export interface SocialLinkItem {
  platform: 'telegram' | 'linkedin' | 'instagram' | 'whatsapp' | string;
  url: string;
  titleFa: string;
  titleEn: string;
  enabled: boolean;
}

export interface CompanyContactInfo {
  // 1. Company Identity
  nameFa: string;
  nameEn: string;
  legalNameFa: string;
  legalNameEn: string;
  sloganFa: string;
  sloganEn: string;
  website: string;
  email: string;

  // Phase 7.2 Named Aliases
  companyNameFa?: string;
  companyNameEn?: string;
  taglineFa?: string;
  taglineEn?: string;
  officeAddressFa?: string;
  officeAddressEn?: string;

  // 2. Contact & Repeatable Lines
  primaryPhone: string;
  primaryPhoneDisplayFa: string;
  primaryPhoneDisplayEn: string;
  primaryPhoneTel: string;

  primaryMobile?: string;
  secondaryMobile?: string;
  landlinePhones?: string[];

  // Landline Phone (Central Office Primary)
  landlinePhone: string;
  landlinePhoneDisplayFa: string;
  landlinePhoneDisplayEn: string;
  landlinePhoneTel: string;

  // WhatsApp
  whatsappNumber: string;
  whatsappUrl: string;

  // Inquiries & Technical Mail
  inquiryEmail?: string;
  technicalEmail?: string;

  // Communication & CTA Visibility States
  whatsappEnabled?: boolean;
  phoneEnabled?: boolean;
  contactCtaEnabled?: boolean;

  // Social Links
  socialLinks?: SocialLinkItem[];

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
  postalCode?: string;

  // 3. Working Hours (Structured + Generated Outputs)
  workingHoursConfig?: StructuredWorkingHours;
  workingHoursFa: string;
  workingHoursEn: string;
  workingHoursShortFa: string;
  workingHoursShortEn: string;

  // 4. Global Website Settings
  defaultLanguage?: 'fa' | 'en' | 'domain_based';
  showFloatingActions?: boolean;
  showTopAnnouncement?: boolean;
  announcementTextFa?: string;
  announcementTextEn?: string;

  // Map & Navigation Links
  maps: {
    google: string;
    neshan: string;
    balad: string;
  };
}

export function toPersianDigits(val: string | number): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(val).replace(/\d/g, (d) => farsiDigits[parseInt(d, 10)]);
}

export function generateWorkingHoursStrings(config: StructuredWorkingHours) {
  const openFa = toPersianDigits(config.openTime);
  const closeFa = toPersianDigits(config.closeTime);

  let fullFa = `${config.workDaysFa}: ${openFa} الی ${closeFa}`;
  let fullEn = `${config.workDaysEn}: ${config.openTime} - ${config.closeTime}`;

  if (config.hasThursdayHours && config.thursdayOpenTime && config.thursdayCloseTime) {
    const thuOpenFa = toPersianDigits(config.thursdayOpenTime);
    const thuCloseFa = toPersianDigits(config.thursdayCloseTime);
    fullFa += ` | پنج‌شنبه: ${thuOpenFa} الی ${thuCloseFa}`;
    fullEn += ` | Thu: ${config.thursdayOpenTime} - ${config.thursdayCloseTime}`;
  }

  const shortFa = `${openFa} الی ${closeFa}`;
  const shortEn = `${config.openTime} - ${config.closeTime}`;

  return {
    workingHoursFa: fullFa,
    workingHoursEn: fullEn,
    workingHoursShortFa: shortFa,
    workingHoursShortEn: shortEn,
  };
}

export const CANONICAL_WORKING_HOURS_CONFIG: StructuredWorkingHours = {
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

const canonicalHoursStrings = generateWorkingHoursStrings(CANONICAL_WORKING_HOURS_CONFIG);

export const COMPANY_INFO: CompanyContactInfo = {
  nameFa: 'پولاد چرخِش',
  nameEn: 'PoladCharkhesh',
  legalNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  legalNameEn: 'Polad Charkhesh Industrial Trading Co.',
  sloganFa: 'تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد',
  sloganEn: 'Supply and distribution of all types of oil, mining and steel bearings',
  website: 'https://poladcharkhesh.ir',
  email: 'info@poladcharkhesh.ir',

  // Phase 7.2 Named Aliases
  companyNameFa: 'پولاد چرخِش',
  companyNameEn: 'PoladCharkhesh',
  taglineFa: 'تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد',
  taglineEn: 'Supply and distribution of all types of oil, mining and steel bearings',
  officeAddressFa: 'تهران، منطقه نارمک، خیابان دردشت، پلاک ۴۳۳',
  officeAddressEn: 'No. 433, Dardasht Street, Narmak, Tehran, Iran',

  // Primary phone number as designated for Polad Charkhesh
  primaryPhone: '09127195313',
  primaryMobile: '09127195313',
  secondaryMobile: '09126172282',
  landlinePhones: ['02177209117', '02133939482'],
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

  // Emails
  inquiryEmail: 'info@poladcharkhesh.ir',
  technicalEmail: 'info@poladcharkhesh.ir',

  // Communication & CTA Visibility States
  whatsappEnabled: true,
  phoneEnabled: true,
  contactCtaEnabled: true,

  // Social links intentionally start empty until verified and entered by an administrator.
  socialLinks: [],

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
  postalCode: '',

  // Operational schedule (Standardized 08:00 - 16:00)
  workingHoursConfig: CANONICAL_WORKING_HOURS_CONFIG,
  workingHoursFa: canonicalHoursStrings.workingHoursFa,
  workingHoursEn: canonicalHoursStrings.workingHoursEn,
  workingHoursShortFa: canonicalHoursStrings.workingHoursShortFa,
  workingHoursShortEn: canonicalHoursStrings.workingHoursShortEn,

  // Global Website Settings
  defaultLanguage: 'domain_based',
  showFloatingActions: true,
  showTopAnnouncement: true,
  announcementTextFa: 'تأمین مستقیم و فوری انواع بیرینگ صنایع فولاد، نفت و سیمان با تضمین اصالت فیزیکی',
  announcementTextEn: 'Direct Procurement of Heavy Industrial Bearings for Steel, Oil & Mining Industries with Authenticity Guarantee',

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
  baseUrl?: string;
  productCode?: string;
  productName?: string;
  dimensions?: string;
  brands?: string[];
  customMessage?: string;
  language?: 'fa' | 'en';
}): string {
  const base = params?.baseUrl || COMPANY_INFO.whatsappUrl;
  if (!base) return '';
  if (!params) {
    return base;
  }

  const isFa = params.language !== 'en';

  if (params.customMessage) {
    return `${base}?text=${encodeURIComponent(params.customMessage)}`;
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

  return `${base}?text=${encodeURIComponent(text)}`;
}
