import { DEFAULT_PAGE_CONTENT } from '../src/data/cmsDefaults';
import { isSafeAssetUrl } from './assetUrls';
/**
 * POLAD CHARKHESH - SERVER-SIDE VALIDATION INFRASTRUCTURE
 * 
 * Centralized, authoritative input validation & sanitization for:
 * - Products (engineering geometry, ISO 281 capacities, strings)
 * - Company identity & contacts (strict whitelist, length caps)
 * - CMS content (hero, about, footer)
 * - SEO metadata (titles, descriptions, URL schemes)
 * - Inquiries / RFQ (customer inputs, spam prevention)
 * - Media metadata
 * 
 * SECURITY RULES:
 * - Whitelist-based field filtering (disallows unapproved property injection)
 * - Prototype pollution defense
 * - Bounded string lengths to prevent DOS/memory bloat
 * - Mathematical geometry sanity checking for rotary bearings
 */

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  sanitized?: T;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function containsForbiddenKeys(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (typeof obj[key] === 'object' && containsForbiddenKeys(obj[key])) return true;
  }
  return false;
}

// ==========================================
// 1. PRODUCT VALIDATION
// ==========================================

export const VALID_BEARING_CATEGORIES = [
  'ball',
  'roller',
  'spherical',
  'cylindrical',
  'thrust',
  'housing',
  'seal',
  'lubricant',
] as const;

export function validateProductCandidate(body: any, isUpdate = false): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده ورودی نامعتبر است (شیء JSON مورد انتظار است).'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['کلیدهای غیرمجاز در بدنه درخواست تشخیص داده شد.'] };
  }

  // Required on create
  if (!isUpdate) {
    if (!body.code || typeof body.code !== 'string' || !body.code.trim()) {
      errors.push('شماره فنی کالا (code) الزامی است.');
    }
    if (!body.category || !VALID_BEARING_CATEGORIES.includes(body.category)) {
      errors.push(`دسته‌بندی نامعتبر است. دسته‌های مجاز: ${VALID_BEARING_CATEGORIES.join(', ')}`);
    }
    if (!body.nameFa || typeof body.nameFa !== 'string' || !body.nameFa.trim()) {
      errors.push('نام فارسی کالا الزامی است.');
    }
    if (!body.nameEn || typeof body.nameEn !== 'string' || !body.nameEn.trim()) {
      errors.push('نام انگلیسی کالا الزامی است.');
    }
  }

  // String bounds
  if (body.code && (typeof body.code !== 'string' || body.code.length > 80)) {
    errors.push('شماره فنی کالا نمی‌تواند بیش از ۸۰ نویسه باشد.');
  }
  if (body.nameFa && (typeof body.nameFa !== 'string' || body.nameFa.length > 200)) {
    errors.push('نام فارسی کالا نمی‌تواند بیش از ۲۰۰ نویسه باشد.');
  }
  if (body.nameEn && (typeof body.nameEn !== 'string' || body.nameEn.length > 200)) {
    errors.push('نام انگلیسی کالا نمی‌تواند بیش از ۲۰۰ نویسه باشد.');
  }
  if (body.descriptionFa && typeof body.descriptionFa === 'string' && body.descriptionFa.length > 5000) {
    errors.push('توضیحات فارسی کالا بیش از حد طولانی است (حداکثر ۵۰۰۰ نویسه).');
  }
  if (body.descriptionEn && typeof body.descriptionEn === 'string' && body.descriptionEn.length > 5000) {
    errors.push('توضیحات انگلیسی کالا بیش از حد طولانی است (حداکثر ۵۰۰۰ نویسه).');
  }

  for (const key of ['imageUrl', 'pdfUrl']) if (body[key] !== undefined && !isSafeAssetUrl(body[key])) errors.push(`Invalid ${key}`);
  if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 100 || body.images.some((url: any) => !isSafeAssetUrl(url, false)))) errors.push('Invalid product gallery');

  // Category check if provided
  if (body.category && !VALID_BEARING_CATEGORIES.includes(body.category)) {
    errors.push(`دسته‌بندی نامعتبر است. دسته‌های مجاز: ${VALID_BEARING_CATEGORIES.join(', ')}`);
  }

  // Engineering Dimensional & Capacity Sanity for rotary bearings
  const rotaryCategories = ['ball', 'roller', 'spherical', 'cylindrical', 'thrust'];
  const isRotary = body.category ? rotaryCategories.includes(body.category) : true;

  if (isRotary) {
    // Required dimensions and capacities on creation
    if (!isUpdate) {
      if (body.d === undefined || body.d === null || body.d === '') {
        errors.push('قطر داخلی (d) الزامی است.');
      }
      if (body.D === undefined || body.D === null || body.D === '') {
        errors.push('قطر خارجی (D) الزامی است.');
      }
      if (body.B === undefined || body.B === null || body.B === '') {
        errors.push('پهنا یا ارتفاع (B) الزامی است.');
      }
      if (body.crKn === undefined || body.crKn === null || body.crKn === '') {
        errors.push('ظرفیت بار دینامیکی Cr الزامی است.');
      }
      if (body.corKn === undefined || body.corKn === null || body.corKn === '') {
        errors.push('ظرفیت بار استاتیکی C0r الزامی است.');
      }
    }

    const d = body.d !== undefined && body.d !== null && body.d !== '' ? Number(body.d) : undefined;
    const D = body.D !== undefined && body.D !== null && body.D !== '' ? Number(body.D) : undefined;
    const B = body.B !== undefined && body.B !== null && body.B !== '' ? Number(body.B) : undefined;

    if (d !== undefined && (isNaN(d) || d <= 0 || d > 3000)) {
      errors.push('قطر داخلی (d) باید عددی مثبت و کمتر از ۳۰۰۰ میلیمتر باشد.');
    }
    if (D !== undefined && (isNaN(D) || D <= 0 || D > 5000)) {
      errors.push('قطر خارجی (D) باید عددی مثبت و کمتر از ۵۰۰۰ میلیمتر باشد.');
    }
    if (B !== undefined && (isNaN(B) || B <= 0 || B > 2000)) {
      errors.push('پهنا (B) باید عددی مثبت و کمتر از ۲۰۰۰ میلیمتر باشد.');
    }

    // Critical physical invariant: Outside diameter D must strictly exceed bore diameter d
    if (d !== undefined && D !== undefined && !isNaN(d) && !isNaN(D) && D <= d) {
      errors.push(`ابعاد فیزیکی نامعتبر: قطر خارجی D (${D}mm) باید اکیداً از قطر داخلی d (${d}mm) بزرگتر باشد.`);
    }

    if (body.crKn !== undefined && body.crKn !== null && body.crKn !== '') {
      const cr = Number(body.crKn);
      if (isNaN(cr) || cr <= 0 || cr > 50000) {
        errors.push('ظرفیت بار دینامیکی Cr باید عددی معتبر و مثبت باشد.');
      }
    }
    if (body.corKn !== undefined && body.corKn !== null && body.corKn !== '') {
      const cor = Number(body.corKn);
      if (isNaN(cor) || cor <= 0 || cor > 80000) {
        errors.push('ظرفیت بار استاتیکی C0r باید عددی معتبر و مثبت باشد.');
      }
    }
    if (body.speedGreaseRpm !== undefined && body.speedGreaseRpm !== null && body.speedGreaseRpm !== '') {
      const spd = Number(body.speedGreaseRpm);
      if (isNaN(spd) || spd < 0 || spd > 200000) {
        errors.push('سرعت نامی با گریس نامعتبر است.');
      }
    }
    if (body.speedOilRpm !== undefined && body.speedOilRpm !== null && body.speedOilRpm !== '') {
      const spd = Number(body.speedOilRpm);
      if (isNaN(spd) || spd < 0 || spd > 200000) {
        errors.push('سرعت نامی با روغن نامعتبر است.');
      }
    }

    // ISO & Manufacturer Calculation Factors Bounds (when supplied)
    if (body.calculationFactorE !== undefined && body.calculationFactorE !== null && body.calculationFactorE !== '') {
      const eVal = Number(body.calculationFactorE);
      if (isNaN(eVal) || eVal <= 0 || eVal > 2.5) {
        errors.push('ضریب بار محوری e باید عددی مثبت و حداکثر ۲.۵ باشد.');
      }
    }
    if (body.calculationFactorY !== undefined && body.calculationFactorY !== null && body.calculationFactorY !== '') {
      const yVal = Number(body.calculationFactorY);
      if (isNaN(yVal) || yVal <= 0 || yVal > 15.0) {
        errors.push('ضریب تراست Y باید عددی مثبت و حداکثر ۱۵ باشد.');
      }
    }
    if (body.calculationFactorY0 !== undefined && body.calculationFactorY0 !== null && body.calculationFactorY0 !== '') {
      const y0Val = Number(body.calculationFactorY0);
      if (isNaN(y0Val) || y0Val <= 0 || y0Val > 15.0) {
        errors.push('ضریب تراست استاتیک Y0 باید عددی مثبت و حداکثر ۱۵ باشد.');
      }
    }
    if (body.calculationFactorY1 !== undefined && body.calculationFactorY1 !== null && body.calculationFactorY1 !== '') {
      const y1Val = Number(body.calculationFactorY1);
      if (isNaN(y1Val) || y1Val <= 0 || y1Val > 15.0) {
        errors.push('ضریب تراست Y1 باید عددی مثبت و حداکثر ۱۵ باشد.');
      }
    }
    if (body.calculationFactorY2 !== undefined && body.calculationFactorY2 !== null && body.calculationFactorY2 !== '') {
      const y2Val = Number(body.calculationFactorY2);
      if (isNaN(y2Val) || y2Val <= 0 || y2Val > 15.0) {
        errors.push('ضریب تراست Y2 باید عددی مثبت و حداکثر ۱۵ باشد.');
      }
    }
    if (body.calculationFactorX !== undefined && body.calculationFactorX !== null && body.calculationFactorX !== '') {
      const xVal = Number(body.calculationFactorX);
      if (isNaN(xVal) || xVal <= 0 || xVal > 5.0) {
        errors.push('ضریب شعاعی X باید عددی مثبت و حداکثر ۵ باشد.');
      }
    }
    if (body.calculationFactorF0 !== undefined && body.calculationFactorF0 !== null && body.calculationFactorF0 !== '') {
      const f0Val = Number(body.calculationFactorF0);
      if (isNaN(f0Val) || f0Val <= 0 || f0Val > 30.0) {
        errors.push('ضریب هندسی f0 باید عددی مثبت و حداکثر ۳۰ باشد.');
      }
    }
    if (body.rMin !== undefined && body.rMin !== null && body.rMin !== '') {
      const rVal = Number(body.rMin);
      if (isNaN(rVal) || rVal <= 0 || rVal > 50.0) {
        errors.push('حداقل شعاع لچکی (rMin) باید عددی مثبت و حداکثر ۵۰ میلیمتر باشد.');
      }
    }
    if (body.weightKg !== undefined && body.weightKg !== null && body.weightKg !== '') {
      const wVal = Number(body.weightKg);
      if (isNaN(wVal) || wVal < 0 || wVal > 50000) {
        errors.push('وزن کالا باید عددی معتبر و غیر منفی باشد.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ==========================================
// 2. COMPANY VALIDATION
// ==========================================

const ALLOWED_COMPANY_FIELDS = [
  // Identity
  'nameFa', 'nameEn', 'companyNameFa', 'companyNameEn',
  'legalNameFa', 'legalNameEn',
  'sloganFa', 'sloganEn', 'taglineFa', 'taglineEn',
  'website', 'email', 'inquiryEmail', 'technicalEmail',

  // Phone & Contacts
  'primaryPhone', 'primaryMobile', 'secondaryMobile', 'landlinePhone', 'landlinePhones',
  'primaryPhoneDisplayFa', 'primaryPhoneDisplayEn', 'primaryPhoneTel',
  'landlinePhoneDisplayFa', 'landlinePhoneDisplayEn', 'landlinePhoneTel',
  'whatsappNumber', 'whatsappUrl',

  // Visibility & Toggles
  'whatsappEnabled', 'phoneEnabled', 'contactCtaEnabled',
  'socialLinks', 'maps',

  // Address
  'addressFa', 'addressEn', 'officeAddressFa', 'officeAddressEn',
  'provinceFa', 'provinceEn', 'cityFa', 'cityEn',
  'districtFa', 'districtEn', 'streetFa', 'streetEn', 'plate', 'postalCode',

  // Working Hours
  'workingHoursConfig', 'workingHoursFa', 'workingHoursEn',
  'workingHoursShortFa', 'workingHoursShortEn',

  // Global Website Settings
  'defaultLanguage', 'showFloatingActions', 'showTopAnnouncement',
  'announcementTextFa', 'announcementTextEn',
  'contactCtaVisibility', 'whatsappVisibility', 'phoneVisibility'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s\-()]{5,30}$/;

export function validateCompanyPayload(body: any): ValidationResult<Record<string, any>> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده نامعتبر است (شیء JSON مورد انتظار است).'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const booleans = ['whatsappEnabled','phoneEnabled','contactCtaEnabled','showFloatingActions','showTopAnnouncement','contactCtaVisibility','whatsappVisibility','phoneVisibility'];
  for (const field of ALLOWED_COMPANY_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (booleans.includes(field)) { if (typeof value !== 'boolean') errors.push(`Invalid ${field}`); }
    else if (field === 'landlinePhones') {
      if (!Array.isArray(value) || value.length > 10 || value.some(v => typeof v !== 'string' || !PHONE_REGEX.test(v))) errors.push('Invalid phone list');
    } else if (field === 'socialLinks') {
      if (!Array.isArray(value) || value.length > 15 || value.some(v => !v || typeof v !== 'object' || ['platform','url','titleFa','titleEn'].some(k => typeof v[k] !== 'string') || typeof v.enabled !== 'boolean' || !isSafeAssetUrl(v.url))) errors.push('Invalid social links');
    } else if (field === 'maps') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([k,v]) => !['google','neshan','balad'].includes(k) || !isSafeAssetUrl(v))) errors.push('Invalid maps');
    } else if (field === 'workingHoursConfig') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([k,v]) => k === 'hasThursdayHours' ? typeof v !== 'boolean' : !['workDaysFa','workDaysEn','openTime','closeTime','thursdayOpenTime','thursdayCloseTime','closedDaysFa','closedDaysEn'].includes(k) || typeof v !== 'string' || v.length > 100)) errors.push('Invalid working hours');
    } else if (typeof value !== 'string') errors.push(`Invalid ${field}`);
    if (['website','whatsappUrl'].includes(field) && !isSafeAssetUrl(value)) errors.push(`Unsafe ${field}`);
    if (field === 'defaultLanguage' && !['fa','en','domain_based'].includes(value)) errors.push('Invalid default language');
  }
  if (errors.length) return { isValid: false, errors };

  const sanitized: Record<string, any> = {};

  for (const field of ALLOWED_COMPANY_FIELDS) {
    if (body[field] !== undefined) {
      const val = body[field];

      // String validation & length capping
      if (typeof val === 'string') {
        const trimmed = val.trim();

        if (field.includes('Name') && trimmed.length > 200) {
          errors.push(`طول نام ${field} نمی‌تواند بیش از ۲۰۰ نویسه باشد.`);
        } else if ((field.includes('slogan') || field.includes('tagline')) && trimmed.length > 500) {
          errors.push(`طول شعار تجاری (${field}) نمی‌تواند بیش از ۵۰۰ نویسه باشد.`);
        } else if (field.includes('Address') && trimmed.length > 1000) {
          errors.push(`طول آدرس (${field}) نمی‌تواند بیش از ۱۰۰۰ نویسه باشد.`);
        } else if (trimmed.length > 2000) {
          errors.push(`طول فیلد ${field} بیش از حد مجاز است.`);
        }

        // Email validation
        if ((field === 'email' || field === 'inquiryEmail' || field === 'technicalEmail') && trimmed.length > 0) {
          if (!EMAIL_REGEX.test(trimmed)) {
            errors.push(`آدرس پست الکترونیکی در فیلد ${field} نامعتبر است.`);
          }
        }

        // Phone validation
        if ((field === 'primaryMobile' || field === 'primaryPhone' || field === 'secondaryMobile' || field === 'landlinePhone' || field === 'whatsappNumber') && trimmed.length > 0) {
          if (!PHONE_REGEX.test(trimmed)) {
            errors.push(`قالب شماره تماس در فیلد ${field} نامعتبر است.`);
          }
        }

        sanitized[field] = trimmed;
      } else if (typeof val === 'boolean') {
        sanitized[field] = Boolean(val);
      } else if (field === 'landlinePhones' && Array.isArray(val)) {
        // Repeatable landline phone list
        const cleanList: string[] = [];
        for (const phoneItem of val.slice(0, 10)) {
          if (typeof phoneItem === 'string' && phoneItem.trim()) {
            const p = phoneItem.trim();
            if (!PHONE_REGEX.test(p)) {
              errors.push(`شماره تلفن «${p}» در لیست تلفن‌های ثابت نامعتبر است.`);
            } else {
              cleanList.push(p);
            }
          }
        }
        sanitized[field] = cleanList;
      } else if (field === 'workingHoursConfig' && typeof val === 'object' && val !== null) {
        // Structured working hours validation
        const config = {
          workDaysFa: String(val.workDaysFa || 'شنبه تا چهارشنبه').trim().slice(0, 100),
          workDaysEn: String(val.workDaysEn || 'Sat - Wed').trim().slice(0, 100),
          openTime: String(val.openTime || '08:00').trim().slice(0, 10),
          closeTime: String(val.closeTime || '16:00').trim().slice(0, 10),
          hasThursdayHours: Boolean(val.hasThursdayHours),
          thursdayOpenTime: val.thursdayOpenTime ? String(val.thursdayOpenTime).trim().slice(0, 10) : '08:00',
          thursdayCloseTime: val.thursdayCloseTime ? String(val.thursdayCloseTime).trim().slice(0, 10) : '13:00',
          closedDaysFa: String(val.closedDaysFa || 'پنج‌شنبه و جمعه: تعطیل').trim().slice(0, 100),
          closedDaysEn: String(val.closedDaysEn || 'Thu & Fri: Closed').trim().slice(0, 100),
        };
        sanitized[field] = config;
      } else if (field === 'socialLinks' && Array.isArray(val)) {
        sanitized[field] = val.slice(0, 15).map((item: any) => ({
          platform: String(item.platform || '').trim().slice(0, 50),
          url: String(item.url || '').trim().slice(0, 500),
          titleFa: String(item.titleFa || '').trim().slice(0, 100),
          titleEn: String(item.titleEn || '').trim().slice(0, 100),
          enabled: Boolean(item.enabled),
        }));
      } else if (field === 'maps' && typeof val === 'object' && val !== null) {
        sanitized[field] = {
          google: String(val.google || '').trim().slice(0, 500),
          neshan: String(val.neshan || '').trim().slice(0, 500),
          balad: String(val.balad || '').trim().slice(0, 500),
        };
      } else if (field === 'defaultLanguage') {
        const langVal = String(val).toLowerCase();
        if (['fa', 'en', 'domain_based'].includes(langVal)) {
          sanitized[field] = langVal;
        } else {
          errors.push('زبان پیش‌فرض باید یکی از موارد fa، en یا domain_based باشد.');
        }
      } else {
        sanitized[field] = val;
      }
    }
  }

  // Synchronize bidirectional aliases
  if (sanitized.companyNameFa && !sanitized.nameFa) sanitized.nameFa = sanitized.companyNameFa;
  if (sanitized.nameFa && !sanitized.companyNameFa) sanitized.companyNameFa = sanitized.nameFa;

  if (sanitized.companyNameEn && !sanitized.nameEn) sanitized.nameEn = sanitized.companyNameEn;
  if (sanitized.nameEn && !sanitized.companyNameEn) sanitized.companyNameEn = sanitized.nameEn;

  if (sanitized.taglineFa && !sanitized.sloganFa) sanitized.sloganFa = sanitized.taglineFa;
  if (sanitized.sloganFa && !sanitized.taglineFa) sanitized.taglineFa = sanitized.sloganFa;

  if (sanitized.taglineEn && !sanitized.sloganEn) sanitized.sloganEn = sanitized.taglineEn;
  if (sanitized.sloganEn && !sanitized.taglineEn) sanitized.taglineEn = sanitized.sloganEn;

  if (sanitized.officeAddressFa && !sanitized.addressFa) sanitized.addressFa = sanitized.officeAddressFa;
  if (sanitized.addressFa && !sanitized.officeAddressFa) sanitized.officeAddressFa = sanitized.addressFa;

  if (sanitized.officeAddressEn && !sanitized.addressEn) sanitized.addressEn = sanitized.officeAddressEn;
  if (sanitized.addressEn && !sanitized.officeAddressEn) sanitized.officeAddressEn = sanitized.addressEn;

  if (sanitized.primaryMobile && !sanitized.primaryPhone) sanitized.primaryPhone = sanitized.primaryMobile;
  if (sanitized.primaryPhone && !sanitized.primaryMobile) sanitized.primaryMobile = sanitized.primaryPhone;

  if (sanitized.inquiryEmail && !sanitized.email) sanitized.email = sanitized.inquiryEmail;
  if (sanitized.email && !sanitized.inquiryEmail) sanitized.inquiryEmail = sanitized.email;

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}

// ==========================================
// 3. CMS CONTENT VALIDATION
// ==========================================

const teamTemplate = { id: '', nameFa: '', nameEn: '', roleFa: '', roleEn: '', experienceFa: '', experienceEn: '', specialtyFa: '', specialtyEn: '', image: '', phone: '', email: '' };
export function validateContentPayload(body: any): ValidationResult<Record<string, any>> {
  const errors: string[] = [];
  function check(value: any, template: any, at: string, complete = false) {
    if (typeof template === 'string') {
      if (typeof value !== 'string' || value.length > 5000) errors.push(`${at}: expected bounded text`);
      if (at.endsWith('.image') && !isSafeAssetUrl(value)) errors.push(`${at}: unsafe image URL`);
    } else if (Array.isArray(template)) {
      if (!Array.isArray(value) || value.length > 100) { errors.push(`${at}: expected list (maximum 100)`); return; }
      const item = at === 'content.team.members' ? teamTemplate : template[0] ?? '';
      value.forEach((v: any, i: number) => check(v, item, `${at}[${i}]`, true));
    } else {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push(`${at}: expected object`); return; }
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(template, key)) errors.push(`${at}.${key}: unknown field`);
        else check(value[key], template[key], `${at}.${key}`, complete);
      }
      if (complete) for (const key of Object.keys(template)) {
        if (!Object.hasOwn(value, key) && !(at.startsWith('content.team.members[') && ['phone','email'].includes(key))) errors.push(`${at}.${key}: missing field`);
      }
    }
  }
  if (containsForbiddenKeys(body)) errors.push('Forbidden key');
  check(body, DEFAULT_PAGE_CONTENT, 'content');
  return { isValid: errors.length === 0, errors, sanitized: errors.length ? undefined : body };
}

// ==========================================
// 4. SEO VALIDATION
// ==========================================

const ALLOWED_SEO_FIELDS = [
  'defaultTitleFa', 'defaultTitleEn', 'defaultDescriptionFa', 'defaultDescriptionEn',
  'canonicalBaseUrl', 'ogImageUrl', 'keywordsFa', 'keywordsEn',
  'organizationNameFa', 'organizationNameEn', 'googleSiteVerification'
];

export function validateSeoPayload(body: any): ValidationResult<Record<string, any>> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const sanitized: Record<string, any> = {};
  const errors: string[] = [];
  for (const field of Object.keys(body)) {
    const value = body[field];
    if (!ALLOWED_SEO_FIELDS.includes(field)) { errors.push(`Unknown SEO field: ${field}`); continue; }
    if (field === 'keywordsFa' || field === 'keywordsEn') {
      if (!Array.isArray(value) || value.length > 50 || value.some((v: any) => typeof v !== 'string' || v.length > 80)) errors.push(`Invalid ${field}`);
      else sanitized[field] = value;
    } else if (typeof value !== 'string' || value.length > 1000) errors.push(`Invalid ${field}`);
    else if (field === 'ogImageUrl' && !isSafeAssetUrl(value)) errors.push('Invalid image URL');
    else if (field === 'canonicalBaseUrl' && !['https://poladcharkhesh.ir', 'https://poladcharkhesh.com'].includes(value)) errors.push('Canonical domain is fixed');
    else sanitized[field] = value;
  }
  return { isValid: !errors.length, errors, sanitized: errors.length ? undefined : sanitized };
}

// ==========================================
// 5. INQUIRY VALIDATION
// ==========================================

export function validateInquiryPayload(body: any): ValidationResult<{
  fullName: string;
  phone: string;
  message: string;
  company?: string;
  email?: string;
}> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده ورودی استعلام نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const fullName = String(body.fullName || '').trim();
  const phone = String(body.phone || '').trim();
  const message = String(body.message || '').trim();
  const company = body.company ? String(body.company).trim() : undefined;
  const email = body.email ? String(body.email).trim() : undefined;

  if (!fullName || fullName.length < 2 || fullName.length > 150) {
    errors.push('نام و نام خانوادگی الزامی است (حداقل ۲ و حداکثر ۱۵۰ نویسه).');
  }

  if (!phone || phone.length < 5 || phone.length > 40) {
    errors.push('شماره تماس الزامی و معتبر می‌باشد (۵ الی ۴۰ نویسه).');
  }

  if (message.length > 5000) {
    errors.push('متن پیام استعلام نمی‌تواند بیش از ۵۰۰۰ نویسه باشد.');
  }

  if (company && company.length > 200) {
    errors.push('نام شرکت نمی‌تواند بیش از ۲۰۰ نویسه باشد.');
  }

  if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    errors.push('پست الکترونیکی وارد شده نامعتبر است.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      fullName,
      phone,
      message,
      company,
      email,
    },
  };
}

// ==========================================
// 6. MEDIA METADATA VALIDATION
// ==========================================

export function validateMediaPayload(body: any, isUpdate = false): ValidationResult<Record<string, any>> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده ورودی مدیا نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const allowedCategories = ['product_photo', 'cad_schematic', 'datasheet_pdf', 'company_photo'];
  const sanitized: Record<string, any> = {};

  const stringFields = ['filename', 'originalName', 'mimeType', 'url', 'altTextFa', 'altTextEn'];
  for (const field of stringFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string' || body[field].length > 2000) {
        errors.push(`فیلد ${field} نامعتبر یا بیش از حد طولانی است.`);
      } else {
        sanitized[field] = body[field].trim();
      }
    }
  }

  if (body.url !== undefined && !isSafeAssetUrl(body.url, false)) errors.push('Invalid media URL');
  if (body.mimeType !== undefined && !['image/jpeg','image/png','image/webp','application/pdf','application/octet-stream'].includes(body.mimeType)) errors.push('Invalid MIME type');
  if (!isUpdate && !sanitized.originalName) errors.push('نام فایل الزامی است.');
  if (!isUpdate && !sanitized.url) errors.push('آدرس فایل الزامی است.');

  if (body.sizeBytes !== undefined) {
    const size = Number(body.sizeBytes);
    if (!Number.isFinite(size) || size < 0 || size > 1024 * 1024 * 1024) {
      errors.push('حجم فایل نامعتبر است.');
    } else {
      sanitized.sizeBytes = Math.round(size);
    }
  }

  if (!isUpdate && sanitized.sizeBytes === undefined) sanitized.sizeBytes = 0;

  if (body.category !== undefined) {
    if (!allowedCategories.includes(body.category)) {
      errors.push('دسته‌بندی رسانه نامعتبر است.');
    } else {
      sanitized.category = body.category;
    }
  }

  if (body.associatedProductCodes !== undefined) {
    if (!Array.isArray(body.associatedProductCodes)) {
      errors.push('کدهای محصولات مرتبط باید آرایه باشند.');
    } else {
      sanitized.associatedProductCodes = body.associatedProductCodes
        .slice(0, 100)
        .map((code: any) => String(code || '').trim().slice(0, 80))
        .filter(Boolean);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}
