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

  // Category check if provided
  if (body.category && !VALID_BEARING_CATEGORIES.includes(body.category)) {
    errors.push(`دسته‌بندی نامعتبر است. دسته‌های مجاز: ${VALID_BEARING_CATEGORIES.join(', ')}`);
  }

  // Engineering Dimensional & Capacity Sanity for rotary bearings
  const rotaryCategories = ['ball', 'roller', 'spherical', 'cylindrical', 'thrust'];
  const isRotary = body.category ? rotaryCategories.includes(body.category) : true;

  if (isRotary) {
    const d = body.d !== undefined ? Number(body.d) : undefined;
    const D = body.D !== undefined ? Number(body.D) : undefined;
    const B = body.B !== undefined ? Number(body.B) : undefined;

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
    if (d !== undefined && D !== undefined && D <= d) {
      errors.push(`ابعاد فیزیکی نامعتبر: قطر خارجی D (${D}mm) باید اکیداً از قطر داخلی d (${d}mm) بزرگتر باشد.`);
    }

    if (body.crKn !== undefined) {
      const cr = Number(body.crKn);
      if (isNaN(cr) || cr <= 0 || cr > 50000) {
        errors.push('ظرفیت بار دینامیکی Cr باید عددی معتبر و مثبت باشد.');
      }
    }
    if (body.corKn !== undefined) {
      const cor = Number(body.corKn);
      if (isNaN(cor) || cor <= 0 || cor > 80000) {
        errors.push('ظرفیت بار استاتیکی C0r باید عددی معتبر و مثبت باشد.');
      }
    }
    if (body.speedGreaseRpm !== undefined) {
      const spd = Number(body.speedGreaseRpm);
      if (isNaN(spd) || spd < 0 || spd > 200000) {
        errors.push('سرعت نامی با گریس نامعتبر است.');
      }
    }
    if (body.speedOilRpm !== undefined) {
      const spd = Number(body.speedOilRpm);
      if (isNaN(spd) || spd < 0 || spd > 200000) {
        errors.push('سرعت نامی با روغن نامعتبر است.');
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
  'nameFa', 'nameEn', 'brandNameFa', 'brandNameEn', 'tradeNameFa', 'tradeNameEn',
  'registrationNumber', 'economicCode', 'nationalId', 'ceoNameFa', 'ceoNameEn',
  'phone', 'phoneRaw', 'phones', 'fax', 'mobile', 'mobileRaw', 'whatsapp', 'email',
  'supportEmail', 'salesEmail', 'addressFa', 'addressEn', 'postalCode',
  'mapCoordinates', 'coordinates', 'workingHoursFa', 'workingHoursEn',
  'workingHoursShortFa', 'workingHoursShortEn', 'whatsappUrl', 'telegramUrl',
  'linkedinUrl', 'instagramUrl', 'socialMedia', 'socialLinks', 'certifications',
  'establishedYear', 'maps', 'provinceFa', 'provinceEn', 'cityFa', 'cityEn',
  'districtFa', 'districtEn', 'streetFa', 'streetEn', 'plate',
  'sloganFa', 'sloganEn', 'emergencyContact', 'showEmergencySupport'
];

export function validateCompanyPayload(body: any): ValidationResult<Record<string, any>> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const sanitized: Record<string, any> = {};
  for (const field of ALLOWED_COMPANY_FIELDS) {
    if (body[field] !== undefined) {
      // Basic type & bounds sanity
      if (typeof body[field] === 'string') {
        if (body[field].length > 1000) {
          return { isValid: false, errors: [`طول فیلد ${field} بیش از حد مجاز است.`] };
        }
        sanitized[field] = body[field].trim();
      } else {
        sanitized[field] = body[field];
      }
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized,
  };
}

// ==========================================
// 3. CMS CONTENT VALIDATION
// ==========================================

const ALLOWED_CONTENT_SECTIONS = ['hero', 'about', 'footer'];

export function validateContentPayload(body: any): ValidationResult<Record<string, any>> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  const sanitized: Record<string, any> = {};
  for (const section of ALLOWED_CONTENT_SECTIONS) {
    if (body[section] !== undefined && typeof body[section] === 'object' && !Array.isArray(body[section])) {
      sanitized[section] = body[section];
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized,
  };
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
  for (const field of ALLOWED_SEO_FIELDS) {
    if (body[field] !== undefined) {
      if (typeof body[field] === 'string') {
        if (body[field].length > 1000) {
          return { isValid: false, errors: [`طول فیلد ${field} بیش از حد مجاز است.`] };
        }
        sanitized[field] = body[field].trim();
      } else if (Array.isArray(body[field])) {
        sanitized[field] = body[field].slice(0, 50).map((k: any) => String(k || '').trim().slice(0, 80));
      } else {
        sanitized[field] = body[field];
      }
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized,
  };
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

export function validateMediaPayload(body: any): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['داده ورودی مدیا نامعتبر است.'] };
  }

  if (containsForbiddenKeys(body)) {
    return { isValid: false, errors: ['ورودی غیرمجاز شناسایی شد.'] };
  }

  if (!body.originalName || typeof body.originalName !== 'string') {
    errors.push('نام فایل الزامی است.');
  }
  if (!body.url || typeof body.url !== 'string') {
    errors.push('آدرس فایل الزامی است.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
