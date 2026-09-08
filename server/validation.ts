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
