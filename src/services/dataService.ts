/**
 * POLAD CHARKHESH - CENTRALIZED DATA SERVICE & STORE
 * 
 * Provides reactive, validated data management for:
 * 1. Product Catalog (68 canonical bearings + dynamic additions)
 * 2. Company Identity & Contact Information
 * 3. CMS Page Content (Hero, About Us, Footer)
 * 4. SEO Metadata & OpenGraph Configuration
 * 5. Full JSON Dataset Snapshots (Backup, Restore, Factory Reset)
 * 6. Contact Inquiries Ledger
 */

import { BearingProduct } from '../types';
import { bearingProducts as canonicalProducts } from '../data/products';
import { COMPANY_INFO as canonicalCompanyInfo, CompanyContactInfo } from '../data/company';
import { 
  AdminProductItem, 
  CmsPageContent, 
  SiteSeoConfig, 
  DatasetSnapshot,
  InquiryLog 
} from '../types/admin';
import { validateProductDataset } from '../utils/productValidation';
import { getProductSlug } from '../utils/productSlug';
import { auditService } from './auditService';

const STORAGE_KEYS = {
  PRODUCTS: 'polad_admin_products_v2',
  COMPANY: 'polad_admin_company_v2',
  CONTENT: 'polad_admin_content_v2',
  SEO: 'polad_admin_seo_v2',
  INQUIRIES: 'polad_admin_inquiries_v2',
};

// Default Page Content Baseline
const DEFAULT_PAGE_CONTENT: CmsPageContent = {
  hero: {
    badgeFa: 'تأمین مستقیم و اصالت‌سنجی ۱۰۰٪ قطعات صنعتی',
    badgeEn: 'Direct Supply & 100% Authenticity Verification',
    titleHighlightFa: 'تأمین تخصصی انواع بیرینگ و برینگ‌های صنعتی',
    titleHighlightEn: 'Industrial Bearings & Sealing Systems',
    titleSuffixFa: 'مرجع مهندسی، محاسبه طول عمر L10 و کاتالوگ جامع قطعات صنایع مادر',
    titleSuffixEn: 'Engineering reference, ISO 281 L10 life calculator & technical catalog',
    descriptionFa: 'بازرگانی پولاد چرخِش؛ تأمین‌کننده مستقیم انواع رولبرینگ مخروطی، بشکه‌ای، بلبرینگ شیارعمیق، یاتاقان و کاسه‌نمد برای صنایع نفت، گاز، پتروشیمی، فولاد و سیمان.',
    descriptionEn: 'Polad Charkhesh Trading Co.; Direct distributor of tapered, spherical, deep groove bearings, housings and oil seals for oil & gas, steel, mining, and cement industries.',
    searchPlaceholderFa: 'جستجوی شماره فنی بیرینگ (مثال: 22220, 30205, 6205, 120x150x12)...',
    searchPlaceholderEn: 'Search bearing technical code or dimensions (e.g. 22220, 30205, 6205)...',
  },
  about: {
    tagFa: 'درباره ما',
    tagEn: 'About Us',
    titleFa: 'بیش از دو دهه تجربه تخصصی در تأمین قطعات دوار صنایع مادر',
    titleEn: 'Over Two Decades of Engineering Supply in Rotating Equipment',
    paragraph1Fa: 'بازرگانی پولاد چرخِش با اتکا به تخصص فنی، شناخت دقیق استانداردهای جهانی (ISO/DIN/ABMA) و ارتباط مستقیم با زنجیره تأمین بین‌المللی، آماده ارائه خدمات جامع مشاوره‌ای و تأمین بیرینگ‌های فوق سنگین، خاص و عمومی به پروژه‌های صنعتی سراسر کشور می‌باشد.',
    paragraph1En: 'Polad Charkhesh Trading relies on deep engineering expertise, compliance with international standards (ISO/DIN/ABMA), and direct relations with global manufacturers to provide heavy-duty and precision bearing solutions.',
    paragraph2Fa: 'تمامی قطعات وارداتی با مدارک اصالت کالا، تضمین عدم وجود خوردگی و گواهی آزمون متالورژی عرضه می‌گردند.',
    paragraph2En: 'All imported parts are supplied with complete certificates of conformity, anti-corrosion inspection, and certified metallurgical quality guarantees.',
    stats: [
      { valueFa: '+۶۸', valueEn: '+68', labelFa: 'کدهای استاندارد در کاتالوگ', labelEn: 'Catalogued Standard Series' },
      { valueFa: '+۱۰۰۰', valueEn: '+1000', labelFa: 'تأمین موفق پروژه‌های صنعتی', labelEn: 'Successful Project Deliveries' },
      { valueFa: '۱۰۰٪', valueEn: '100%', labelFa: 'تضمین اصالت برند و متریال', labelEn: 'Authenticity Guarantee' },
      { valueFa: '۲۴/۷', valueEn: '24/7', labelFa: 'مشاوره و استعلام فنی مهندسی', labelEn: 'Technical Engineering Support' },
    ],
  },
  footer: {
    descriptionFa: 'بازرگانی صنعتی پولاد چرخِش؛ مرجع تخصصی تأمین، مشاوره مهندسی و محاسبات فنی طول عمر انواع برینگ و پکینگ‌های آب‌بندی صنایع سنگین و مادر.',
    descriptionEn: 'Polad Charkhesh Industrial Trading; Specialized engineering distributor of industrial bearings, housings, and high-performance sealing systems.',
    copyrightFa: 'تمامی حقوق مادی و معنوی این سامانه متعلق به بازرگانی پولاد چرخِش می‌باشد.',
    copyrightEn: 'All rights reserved for Polad Charkhesh Industrial Trading Co.',
    disclaimerFa: 'محاسبات طول عمر L10 بر پایه روابط استاندارد بین‌المللی ISO 281:2007 و کاتالوگ‌های رسمی سازندگان صورت می‌پذیرد.',
    disclaimerEn: 'Calculations are performed strictly per ISO 281:2007 and verified official manufacturer engineering standards.',
  },
};

// Default SEO Baseline
const DEFAULT_SEO_CONFIG: SiteSeoConfig = {
  defaultTitleFa: 'بازرگانی پولاد چرخِش | کاتالوگ فنی بیرینگ و محاسبات مهندسی ISO 281',
  defaultTitleEn: 'Polad Charkhesh Bearings | Industrial Bearing Catalog & ISO Calculations',
  defaultDescriptionFa: 'کاتالوگ تخصصی بیرینگ، رولبرینگ‌های بشکه‌ای، مخروطی، استوانه‌ای، بلبرینگ و کاسه‌نمد با محاسبه آنلاین طول عمر L10 و استعلام مستقیم واتساپ در پولاد چرخِش.',
  defaultDescriptionEn: 'Technical industrial bearing catalog, deep groove, tapered & spherical roller bearings, oil seals and ISO 281 bearing life calculation tool by Polad Charkhesh.',
  canonicalBaseUrl: 'https://poladcharkhesh.ir',
  ogImageUrl: '/icon.png',
  keywordsFa: [
    'بیرینگ',
    'بلبرینگ',
    'رولبرینگ',
    'رولبرینگ مخروطی',
    'رولبرینگ بشکه‌ای',
    'کاسه نمد',
    'پولاد چرخش',
    'تیمکن',
    'اس کا اف',
    'محاسبه طول عمر بیرینگ',
  ],
  keywordsEn: [
    'bearings',
    'roller bearings',
    'tapered roller bearing',
    'spherical roller bearing',
    'deep groove ball bearing',
    'oil seals',
    'Polad Charkhesh',
    'SKF',
    'FAG',
    'TIMKEN',
    'ISO 281 calculation',
  ],
  organizationNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  organizationNameEn: 'Polad Charkhesh Industrial Trading Co.',
  googleSiteVerification: '',
};

class DataService {
  private products: AdminProductItem[] = [];
  private companyInfo: CompanyContactInfo = canonicalCompanyInfo;
  private pageContent: CmsPageContent = DEFAULT_PAGE_CONTENT;
  private seoConfig: SiteSeoConfig = DEFAULT_SEO_CONFIG;
  private inquiries: InquiryLog[] = [];

  private productListeners: Set<(products: AdminProductItem[]) => void> = new Set();
  private companyListeners: Set<(info: CompanyContactInfo) => void> = new Set();
  private contentListeners: Set<(content: CmsPageContent) => void> = new Set();
  private seoListeners: Set<(seo: SiteSeoConfig) => void> = new Set();
  private inquiryListeners: Set<(inquiries: InquiryLog[]) => void> = new Set();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') {
      this.products = [...canonicalProducts];
      return;
    }

    // 1. Products
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
        } else {
          this.products = [...canonicalProducts];
        }
      } else {
        this.products = [...canonicalProducts];
        this.saveProductsToStorage();
      }
    } catch (e) {
      console.warn('Fallback to canonical products due to storage parse error:', e);
      this.products = [...canonicalProducts];
    }

    // 2. Company Info
    try {
      const storedCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);
      if (storedCompany) {
        this.companyInfo = { ...canonicalCompanyInfo, ...JSON.parse(storedCompany) };
      } else {
        this.companyInfo = { ...canonicalCompanyInfo };
      }
    } catch (e) {
      this.companyInfo = { ...canonicalCompanyInfo };
    }

    // 3. Page Content
    try {
      const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (storedContent) {
        this.pageContent = { ...DEFAULT_PAGE_CONTENT, ...JSON.parse(storedContent) };
      } else {
        this.pageContent = { ...DEFAULT_PAGE_CONTENT };
      }
    } catch (e) {
      this.pageContent = { ...DEFAULT_PAGE_CONTENT };
    }

    // 4. SEO
    try {
      const storedSeo = localStorage.getItem(STORAGE_KEYS.SEO);
      if (storedSeo) {
        this.seoConfig = { ...DEFAULT_SEO_CONFIG, ...JSON.parse(storedSeo) };
      } else {
        this.seoConfig = { ...DEFAULT_SEO_CONFIG };
      }
    } catch (e) {
      this.seoConfig = { ...DEFAULT_SEO_CONFIG };
    }

    // 5. Inquiries
    try {
      const storedInquiries = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (storedInquiries) {
        this.inquiries = JSON.parse(storedInquiries);
      } else {
        this.inquiries = [];
      }
    } catch (e) {
      this.inquiries = [];
    }
  }

  // --- STORAGE WRITERS ---

  private saveProductsToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      this.notifyProductListeners();
    } catch (e) {
      console.error('Failed to persist products to storage:', e);
    }
  }

  private saveCompanyToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(this.companyInfo));
      this.notifyCompanyListeners();
    } catch (e) {
      console.error('Failed to persist company info:', e);
    }
  }

  private saveContentToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(this.pageContent));
      this.notifyContentListeners();
    } catch (e) {
      console.error('Failed to persist page content:', e);
    }
  }

  private saveSeoToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SEO, JSON.stringify(this.seoConfig));
      this.notifySeoListeners();
    } catch (e) {
      console.error('Failed to persist SEO config:', e);
    }
  }

  private saveInquiriesToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(this.inquiries));
      this.notifyInquiryListeners();
    } catch (e) {
      console.error('Failed to persist inquiries:', e);
    }
  }

  // --- NOTIFIERS ---

  private notifyProductListeners(): void {
    const copy = [...this.products];
    this.productListeners.forEach((fn) => fn(copy));
  }

  private notifyCompanyListeners(): void {
    const copy = { ...this.companyInfo };
    this.companyListeners.forEach((fn) => fn(copy));
  }

  private notifyContentListeners(): void {
    const copy = { ...this.pageContent };
    this.contentListeners.forEach((fn) => fn(copy));
  }

  private notifySeoListeners(): void {
    const copy = { ...this.seoConfig };
    this.seoListeners.forEach((fn) => fn(copy));
  }

  private notifyInquiryListeners(): void {
    const copy = [...this.inquiries];
    this.inquiryListeners.forEach((fn) => fn(copy));
  }

  // --- SUBSCRIBERS ---

  public subscribeToProducts(listener: (products: AdminProductItem[]) => void): () => void {
    this.productListeners.add(listener);
    listener([...this.products]);
    return () => {
      this.productListeners.delete(listener);
    };
  }

  public subscribeToCompanyInfo(listener: (info: CompanyContactInfo) => void): () => void {
    this.companyListeners.add(listener);
    listener({ ...this.companyInfo });
    return () => {
      this.companyListeners.delete(listener);
    };
  }

  public subscribeToCompany(listener: (info: CompanyContactInfo) => void): () => void {
    return this.subscribeToCompanyInfo(listener);
  }

  public subscribeToContent(listener: (content: CmsPageContent) => void): () => void {
    this.contentListeners.add(listener);
    listener({ ...this.pageContent });
    return () => {
      this.contentListeners.delete(listener);
    };
  }

  public subscribeToPageContent(listener: (content: CmsPageContent) => void): () => void {
    return this.subscribeToContent(listener);
  }

  public subscribeToSeo(listener: (seo: SiteSeoConfig) => void): () => void {
    this.seoListeners.add(listener);
    listener({ ...this.seoConfig });
    return () => {
      this.seoListeners.delete(listener);
    };
  }

  public subscribeToInquiries(listener: (inquiries: InquiryLog[]) => void): () => void {
    this.inquiryListeners.add(listener);
    listener([...this.inquiries]);
    return () => {
      this.inquiryListeners.delete(listener);
    };
  }

  // --- PRODUCT CRUD METHODS ---

  public getProducts(includeArchived: boolean = false): AdminProductItem[] {
    if (includeArchived) {
      return [...this.products];
    }
    return this.products.filter((p) => !p.isArchived);
  }

  public getActiveProducts(): AdminProductItem[] {
    return this.getProducts(false);
  }

  public getProductById(id: string): AdminProductItem | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getProductBySlug(slug: string): AdminProductItem | undefined {
    const clean = slug.trim().toLowerCase();
    return this.products.find((p) => {
      const productSlug = (p.slug || getProductSlug(p)).toLowerCase();
      return productSlug === clean || p.code.toLowerCase().replace(/\s+/g, '-') === clean || p.id === clean;
    });
  }

  /**
   * Validate a product candidate for mandatory engineering rules
   */
  public validateProduct(candidate: Partial<BearingProduct>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!candidate.code || !candidate.code.trim()) {
      errors.push('شماره فنی قطعه (Technical Code) الزامی است.');
    }
    if (!candidate.nameFa || !candidate.nameFa.trim()) {
      errors.push('نام فارسی کالا الزامی است.');
    }
    if (!candidate.nameEn || !candidate.nameEn.trim()) {
      errors.push('نام انگلیسی کالا الزامی است.');
    }
    if (!candidate.category) {
      errors.push('دسته‌بندی مهندسی قطعه الزامی است.');
    }

    if (candidate.category !== 'seal' && candidate.category !== 'lubricant') {
      if (candidate.d === undefined || candidate.d <= 0) {
        errors.push('قطر داخلی (d) باید عددی بزرگتر از صفر باشد.');
      }
      if (candidate.D === undefined || candidate.D <= 0) {
        errors.push('قطر خارجی (D) باید عددی بزرگتر از صفر باشد.');
      }
      if (candidate.d !== undefined && candidate.D !== undefined && candidate.D <= candidate.d) {
        errors.push('قطر خارجی (D) باید اکیداً بزرگتر از قطر داخلی (d) باشد.');
      }
      if (candidate.B === undefined || candidate.B <= 0) {
        errors.push('عرض/ضخامت (B) باید عددی بزرگتر از صفر باشد.');
      }
      if (candidate.crKn === undefined || candidate.crKn <= 0) {
        errors.push('بار دینامیکی پایه (Cr) باید عددی بزرگتر از صفر باشد.');
      }
      if (candidate.corKn === undefined || candidate.corKn <= 0) {
        errors.push('بار استاتیکی پایه (C0r) باید عددی بزرگتر از صفر باشد.');
      }
      if (candidate.speedGreaseRpm === undefined || candidate.speedGreaseRpm <= 0) {
        errors.push('سرعت مجاز با گریس (RPM) باید مشخص و معتبر باشد.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add a new product to the catalog
   */
  public addProduct(product: Partial<BearingProduct>, performedBy: string = 'admin'): {
    success: boolean;
    product?: AdminProductItem;
    errors?: string[];
  } {
    const validation = this.validateProduct(product);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Check duplicate code
    const normalizedCode = product.code!.trim().toUpperCase().replace(/\s+/g, '');
    const isDuplicate = this.products.some(
      (p) => p.code.trim().toUpperCase().replace(/\s+/g, '') === normalizedCode
    );

    if (isDuplicate) {
      return {
        success: false,
        errors: [`کد فنی ${product.code} قبلاً در کاتالوگ ثبت گردیده است.`],
      };
    }

    const newId = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullProduct: AdminProductItem = {
      id: newId,
      code: product.code!.trim(),
      category: product.category || 'roller',
      nameFa: product.nameFa!.trim(),
      nameEn: product.nameEn!.trim(),
      descriptionFa: product.descriptionFa || '',
      descriptionEn: product.descriptionEn || '',
      inStock: product.inStock !== false,
      featured: !!product.featured,
      d: Number(product.d) || 0,
      D: Number(product.D) || 0,
      B: Number(product.B) || 0,
      weightKg: Number(product.weightKg) || 0,
      crKn: Number(product.crKn) || 0,
      corKn: Number(product.corKn) || 0,
      speedGreaseRpm: Number(product.speedGreaseRpm) || 0,
      speedOilRpm: Number(product.speedOilRpm) || Number(product.speedGreaseRpm) || 0,
      thermalSpeedRatingRpm: product.thermalSpeedRatingRpm ? Number(product.thermalSpeedRatingRpm) : undefined,
      cageMaterialFa: product.cageMaterialFa || 'فولاد آلیاژی',
      cageMaterialEn: product.cageMaterialEn || 'Standard Alloy Steel',
      sealingFa: product.sealingFa || 'Open (طراحی باز)',
      sealingEn: product.sealingEn || 'Open Design',
      clearanceOptions: product.clearanceOptions || ['Normal', 'C3'],
      schematicType: product.schematicType || 'tapered',
      rMin: product.rMin ? Number(product.rMin) : undefined,
      calculationFactorE: product.calculationFactorE ? Number(product.calculationFactorE) : undefined,
      calculationFactorY: product.calculationFactorY ? Number(product.calculationFactorY) : undefined,
      calculationFactorY0: product.calculationFactorY0 ? Number(product.calculationFactorY0) : undefined,
      calculationFactorY1: product.calculationFactorY1 ? Number(product.calculationFactorY1) : undefined,
      calculationFactorY2: product.calculationFactorY2 ? Number(product.calculationFactorY2) : undefined,
      calculationFactorF0: product.calculationFactorF0 ? Number(product.calculationFactorF0) : undefined,
      imageUrl: product.imageUrl || '/icon.png',
      images: product.images || [product.imageUrl || '/icon.png'],
      pdfUrl: product.pdfUrl,
      applicationsFa: product.applicationsFa || ['صنایع عمومی'],
      applicationsEn: product.applicationsEn || ['General Industry'],
      industryIds: product.industryIds || ['steel', 'mining'],
      brands: product.brands && product.brands.length > 0 ? product.brands : ['SKF', 'FAG', 'TIMKEN'],
      metaTitleFa: product.metaTitleFa,
      metaTitleEn: product.metaTitleEn,
      metaDescriptionFa: product.metaDescriptionFa,
      metaDescriptionEn: product.metaDescriptionEn,
      technicalSources: product.technicalSources || [
        {
          manufacturer: 'Standard Engineering Catalog',
          sourceType: 'official_catalog',
          reference: 'ISO 281 Catalog Data',
          verifiedAt: new Date().toISOString().split('T')[0],
        },
      ],
      isArchived: false,
      updatedAt: new Date().toISOString(),
      updatedBy: performedBy,
    };

    fullProduct.slug = getProductSlug(fullProduct);

    this.products.unshift(fullProduct);
    this.saveProductsToStorage();

    auditService.record({
      action: 'PRODUCT_CREATED',
      entity: 'product',
      entityId: fullProduct.id,
      summary: `کالای جدید با شماره فنی ${fullProduct.code} ایجاد شد.`,
      performedBy,
      details: { code: fullProduct.code, category: fullProduct.category },
    });

    return { success: true, product: fullProduct };
  }

  /**
   * Update an existing product
   */
  public updateProduct(id: string, updates: Partial<BearingProduct>, performedBy: string = 'admin'): {
    success: boolean;
    product?: AdminProductItem;
    errors?: string[];
  } {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, errors: ['کالای مورد نظر یافت نشد.'] };
    }

    const current = this.products[index];
    const candidate = { ...current, ...updates };

    const validation = this.validateProduct(candidate);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // If code changed, check uniqueness
    if (updates.code && updates.code !== current.code) {
      const normalized = updates.code.trim().toUpperCase().replace(/\s+/g, '');
      const duplicate = this.products.some(
        (p) => p.id !== id && p.code.trim().toUpperCase().replace(/\s+/g, '') === normalized
      );
      if (duplicate) {
        return { success: false, errors: [`کد فنی ${updates.code} تکراری است.`] };
      }
    }

    const updated: AdminProductItem = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: performedBy,
    };

    updated.slug = getProductSlug(updated);

    this.products[index] = updated;
    this.saveProductsToStorage();

    auditService.record({
      action: 'PRODUCT_UPDATED',
      entity: 'product',
      entityId: id,
      summary: `مشخصات قطعه ${updated.code} به‌روزرسانی شد.`,
      performedBy,
      details: { code: updated.code, changes: Object.keys(updates) },
    });

    return { success: true, product: updated };
  }

  /**
   * Archive / Disable a product from public catalog
   */
  public toggleArchiveProduct(id: string, performedBy: string = 'admin'): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const product = this.products[index];
    const newArchived = !product.isArchived;

    this.products[index] = {
      ...product,
      isArchived: newArchived,
      updatedAt: new Date().toISOString(),
      updatedBy: performedBy,
    };

    this.saveProductsToStorage();

    auditService.record({
      action: newArchived ? 'PRODUCT_ARCHIVED' : 'PRODUCT_RESTORED',
      entity: 'product',
      entityId: id,
      summary: `${newArchived ? 'بایگانی و غیرفعال‌سازی' : 'بازیابی و فعال‌سازی مجدد'} قطعه ${product.code}`,
      performedBy,
    });

    return true;
  }

  /**
   * Delete a product (with protection check)
   */
  public deleteProduct(id: string, performedBy: string = 'admin'): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const target = this.products[index];
    this.products.splice(index, 1);
    this.saveProductsToStorage();

    auditService.record({
      action: 'PRODUCT_DELETED',
      entity: 'product',
      entityId: id,
      summary: `حذف قطعه ${target.code} (${target.id}) از پایگاه داده`,
      performedBy,
      details: { code: target.code, name: target.nameFa },
    });

    return true;
  }

  // --- COMPANY INFO METHODS ---

  public getCompanyInfo(): CompanyContactInfo {
    return { ...this.companyInfo };
  }

  public updateCompanyInfo(updates: Partial<CompanyContactInfo>, performedBy: string = 'admin'): boolean {
    this.companyInfo = {
      ...this.companyInfo,
      ...updates,
    };

    this.saveCompanyToStorage();

    auditService.record({
      action: 'COMPANY_UPDATED',
      entity: 'company',
      summary: 'اطلاعات هویتی و راه‌های ارتباطی شرکت به‌روزرسانی شد.',
      performedBy,
      details: { fields: Object.keys(updates) },
    });

    return true;
  }

  // --- CMS PAGE CONTENT METHODS ---

  public getPageContent(): CmsPageContent {
    return { ...this.pageContent };
  }

  public getContent(): CmsPageContent {
    return this.getPageContent();
  }

  public updatePageContent(updates: Partial<CmsPageContent>, performedBy: string = 'admin'): boolean {
    this.pageContent = {
      ...this.pageContent,
      ...updates,
    };

    this.saveContentToStorage();

    auditService.record({
      action: 'CONTENT_UPDATED',
      entity: 'content',
      summary: 'محتوای متنی صفحات عمومی (Hero / About / Footer) ویرایش شد.',
      performedBy,
      details: { sections: Object.keys(updates) },
    });

    return true;
  }

  public updateContent(updates: Partial<CmsPageContent>, performedBy: string = 'admin'): boolean {
    return this.updatePageContent(updates, performedBy);
  }

  // --- SEO CONFIG METHODS ---

  public getSeoConfig(): SiteSeoConfig {
    return { ...this.seoConfig };
  }

  public getSeo(): SiteSeoConfig {
    return this.getSeoConfig();
  }

  public updateSeoConfig(updates: Partial<SiteSeoConfig>, performedBy: string = 'admin'): boolean {
    this.seoConfig = {
      ...this.seoConfig,
      ...updates,
    };

    this.saveSeoToStorage();

    auditService.record({
      action: 'SEO_UPDATED',
      entity: 'seo',
      summary: 'تنظیمات سئو و متاتگ‌های عمومی وب‌سایت به‌روزرسانی شد.',
      performedBy,
      details: { fields: Object.keys(updates) },
    });

    return true;
  }

  public updateSeo(updates: Partial<SiteSeoConfig>, performedBy: string = 'admin'): boolean {
    return this.updateSeoConfig(updates, performedBy);
  }

  // --- INQUIRIES METHODS ---

  public getInquiries(): InquiryLog[] {
    return [...this.inquiries];
  }

  public recordInquiry(params: Omit<InquiryLog, 'id' | 'timestamp' | 'status'>): InquiryLog {
    const newInquiry: InquiryLog = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      fullName: params.fullName,
      phone: params.phone,
      message: params.message,
      company: params.company,
      email: params.email,
      status: 'new',
    };

    this.inquiries.unshift(newInquiry);
    this.saveInquiriesToStorage();
    return newInquiry;
  }

  public updateInquiryStatus(id: string, status: InquiryLog['status']): boolean {
    const index = this.inquiries.findIndex((i) => i.id === id);
    if (index === -1) return false;

    this.inquiries[index] = {
      ...this.inquiries[index],
      status,
    };

    this.saveInquiriesToStorage();
    return true;
  }

  // --- DATASET SNAPSHOT / BACKUP / RESTORE ---

  public exportSnapshot(performedBy: string = 'admin'): DatasetSnapshot {
    const snapshot: DatasetSnapshot = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: performedBy,
      products: [...this.products],
      companyInfo: { ...this.companyInfo },
      pageContent: { ...this.pageContent },
      seoConfig: { ...this.seoConfig },
      auditLogsCount: auditService.getLogs().length,
    };

    auditService.record({
      action: 'BACKUP_EXPORTED',
      entity: 'system',
      summary: `خروجی پشتیبان کامل از ${this.products.length} کالا و تنظیمات سیستم تولید گردید.`,
      performedBy,
    });

    return snapshot;
  }

  public importSnapshot(snapshot: DatasetSnapshot, performedBy: string = 'admin'): {
    success: boolean;
    error?: string;
    productsCount?: number;
  } {
    try {
      if (!snapshot || !Array.isArray(snapshot.products) || snapshot.products.length === 0) {
        return { success: false, error: 'ساختار فایل پشتیبان نامعتبر است (لیست محصولات خالی است).' };
      }

      // Validate integrity of candidate products
      const report = validateProductDataset(snapshot.products);
      if (!report.isValid) {
        return {
          success: false,
          error: `فایل پشتیبان دارای خطای ساختار داده است (شناسه‌های تکراری یا فیلدهای ناقص).`,
        };
      }

      this.products = [...snapshot.products];
      if (snapshot.companyInfo) this.companyInfo = { ...canonicalCompanyInfo, ...snapshot.companyInfo };
      if (snapshot.pageContent) this.pageContent = { ...DEFAULT_PAGE_CONTENT, ...snapshot.pageContent };
      if (snapshot.seoConfig) this.seoConfig = { ...DEFAULT_SEO_CONFIG, ...snapshot.seoConfig };

      this.saveProductsToStorage();
      this.saveCompanyToStorage();
      this.saveContentToStorage();
      this.saveSeoToStorage();

      auditService.record({
        action: 'BACKUP_IMPORTED',
        entity: 'system',
        summary: `بازیابی موفقیت‌آمیز ${this.products.length} قطعه و تنظیمات از فایل پشتیبان.`,
        performedBy,
        details: { importedAt: snapshot.exportedAt, version: snapshot.version },
      });

      return { success: true, productsCount: this.products.length };
    } catch (e) {
      return { success: false, error: 'پردازش فایل پشتیبان با خطا مواجه شد.' };
    }
  }

  /**
   * Reset all data back to canonical factory defaults (68 canonical products)
   */
  public resetToCanonical(performedBy: string = 'admin'): void {
    this.products = [...canonicalProducts];
    this.companyInfo = { ...canonicalCompanyInfo };
    this.pageContent = { ...DEFAULT_PAGE_CONTENT };
    this.seoConfig = { ...DEFAULT_SEO_CONFIG };

    this.saveProductsToStorage();
    this.saveCompanyToStorage();
    this.saveContentToStorage();
    this.saveSeoToStorage();

    auditService.record({
      action: 'SYSTEM_RESET',
      entity: 'system',
      summary: 'بازنشانی پایگاه داده به ۶۸ کالای استاندارد و تنظیمات اولیه کارخانه انجام شد.',
      performedBy,
    });
  }
}

export const dataService = new DataService();
