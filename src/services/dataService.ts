/**
 * POLAD CHARKHESH - CLIENT-SIDE DATA STORE & REACTIVE SUBSCRIPTION SERVICE
 * 
 * Manages reactive in-memory state and synchronization with the Express + SQLite backend.
 * Delegates remote HTTP operations to domain services:
 * - productService
 * - companyService
 * - contentService
 * - seoService
 * - inquiryService
 * - systemService
 */

import { useState, useEffect } from 'react';
import { BearingProduct } from '../types';
import { bearingProducts as canonicalProducts } from '../data/products';
import { COMPANY_INFO as canonicalCompanyInfo, CompanyContactInfo } from '../data/company';
import {
  AdminUser,
  AdminProductItem,
  CmsPageContent,
  SiteSeoConfig,
  InquiryLog,
  DatasetSnapshot,
} from '../types/admin';
import { productService } from './productService';
import { companyService } from './companyService';
import { contentService } from './contentService';
import { seoService } from './seoService';
import { inquiryService } from './inquiryService';
import { systemService } from './systemService';
import { authService } from './authService';

export const DEFAULT_PAGE_CONTENT: CmsPageContent = {
  hero: {
    badgeFa: 'مرجع معتبر تأمین و توزیع بیرینگ‌های صنعتی',
    badgeEn: 'Trusted Industrial Bearing Distributor',
    titleHighlightFa: 'پولاد چرخِش',
    titleHighlightEn: 'PoladCharkhesh',
    titleSuffixFa: 'تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد',
    titleSuffixEn: 'Supply and distribution of all types of oil, mining and steel bearings',
    descriptionFa: 'بیش از ۲۵ سال تعهد به تأمین قطعات ۱۰۰٪ اورجینال، کاهش توقف خطوط تولید و ارائه مشاوره‌های دقیق فنی به صنایع مادر کشور.',
    descriptionEn: 'Over 25 years of proven excellence supplying genuine industrial parts, reducing machinery downtime, and providing mechanical consultation.',
    searchPlaceholderFa: 'جستجوی کد فنی (مانند 6204-2RS ، 30208 ، 22212 یا کاسه نمد)...',
    searchPlaceholderEn: 'Search bearing code (e.g., 6204-2RS, 30208, 22212 or oil seal)...',
  },
  about: {
    tagFa: 'شناخت پولاد چرخِش',
    tagEn: 'About PoladCharkhesh',
    titleFa: 'پیشگام در تأمین چرخش‌های صنعتی بی‌وقفه',
    titleEn: 'Engineering Supply for Reliable Industrial Rotation',
    paragraph1Fa: 'شرکت بازرگانی پولاد چرخِش با استقرار در بازار فنی و صنعتی تهران، در تأمین انواع بلبرینگ، رولبرینگ، یاتاقان صنعتی و کاسه نمد تخصصی فعالیت می‌کند.',
    paragraph1En: 'Polad Charkhesh supplies industrial ball bearings, roller bearings, housings, and specialized seals for demanding applications.',
    paragraph2Fa: 'تمرکز ما بر انتخاب صحیح قطعه، افزایش طول عمر تجهیزات و کاهش توقف پرهزینه خطوط تولید است.',
    paragraph2En: 'Our focus is correct component selection, longer equipment life, and reduced unplanned downtime.',
    missionTitleFa: 'رسالت و مأموریت ما',
    missionTitleEn: 'Our Mission',
    missionTextFa: 'تأمین سریع قطعات اصلی و ارائه مشاوره مهندسی قابل اتکا برای صنایع.',
    missionTextEn: 'Fast supply of genuine components with dependable engineering consultation.',
    visionTitleFa: 'چشم‌انداز سازمانی',
    visionTitleEn: 'Our Vision',
    visionTextFa: 'تبدیل شدن به مرجع قابل اعتماد اطلاعات فنی و تأمین قطعات دوار مکانیکی.',
    visionTextEn: 'To be a trusted source for rotating-equipment technical information and supply.',
    features: [
      { id: 'authenticity', titleFa: 'اصالت تضمینی قطعات', titleEn: 'Verified Authenticity', descriptionFa: 'بررسی اصالت و مستندات کالا پیش از تحویل', descriptionEn: 'Authenticity and documentation checks before delivery', icon: 'ShieldCheck' },
      { id: 'delivery', titleFa: 'تحویل سریع', titleEn: 'Fast Dispatch', descriptionFa: 'ارسال سریع قطعات موجود به سراسر کشور', descriptionEn: 'Rapid dispatch of available parts nationwide', icon: 'Truck' },
      { id: 'consulting', titleFa: 'مشاوره فنی', titleEn: 'Technical Consultation', descriptionFa: 'معادل‌یابی کدها و بررسی شرایط کاری', descriptionEn: 'Cross-reference support and operating-condition review', icon: 'Wrench' },
      { id: 'efficiency', titleFa: 'تأمین مستقیم', titleEn: 'Direct Supply', descriptionFa: 'کاهش لایه‌های غیرضروری در زنجیره تأمین', descriptionEn: 'A streamlined industrial supply chain', icon: 'TrendingDown' },
    ],
    stats: [
      { valueFa: '۲۵+', valueEn: '25+', labelFa: 'سال تجربه تخصصی', labelEn: 'Years Experience' },
      { valueFa: '۱۰۰٪', valueEn: '100%', labelFa: 'تمرکز بر اصالت', labelEn: 'Authenticity Focus' },
      { valueFa: '۶۸+', valueEn: '68+', labelFa: 'محصول مهندسی ثبت‌شده', labelEn: 'Catalog Products' },
      { valueFa: '۲۴h', valueEn: '24h', labelFa: 'ارسال سریع موجودی', labelEn: 'Fast Dispatch' },
    ],
  },
  catalog: {
    tagFa: 'بانک جامع قطعات صنعتی',
    tagEn: 'Industrial Product Catalog',
    titleFa: 'کاتالوگ تعاملی و مشخصات فنی',
    titleEn: 'Interactive Catalog & Technical Specifications',
    subtitleFa: 'جستجو و بررسی ابعاد، بارها و اطلاعات مهندسی قطعات موجود در کاتالوگ.',
    subtitleEn: 'Search and review dimensions, load ratings, and engineering specifications across the catalog.',
  },
  tools: {
    tagFa: 'ابزارهای تخصصی مهندسی مکانیک',
    tagEn: 'Engineering Tools',
    titleFa: 'محاسبه‌گرهای مهندسی بیرینگ',
    titleEn: 'Bearing Engineering Calculators',
    subtitleFa: 'ابزارهای کمکی برای بررسی لقی، عمر و شرایط حرارتی بر اساس ورودی‌های کاربر.',
    subtitleEn: 'Supporting tools for clearance, bearing life, and thermal-condition evaluation.',
  },
  whyUs: {
    tagFa: 'مزایای همکاری با پولاد چرخِش',
    tagEn: 'Why Choose PoladCharkhesh',
    titleFa: 'چرا مهندسان و صنایع برتر ما را انتخاب می‌کنند؟',
    titleEn: 'Why Industrial Teams Work with Us',
    subtitleFa: '',
    subtitleEn: '',
    commitmentFa: 'تعهد پولاد چرخِش به تأمین قابل اتکا',
    commitmentEn: 'PoladCharkhesh Supply Commitment',
    cards: [
      { id: 'genuine', titleFa: 'ضمانت اصالت کالا', titleEn: 'Authenticity First', descriptionFa: 'تمرکز بر تأمین قطعات اصلی و قابل ردیابی.', descriptionEn: 'Focus on genuine, traceable industrial components.', icon: 'ShieldCheck' },
      { id: 'stock', titleFa: 'پاسخ سریع به نیاز صنعتی', titleEn: 'Responsive Supply', descriptionFa: 'پاسخگویی سریع به استعلام و بررسی موجودی.', descriptionEn: 'Fast response to inquiries and availability checks.', icon: 'Warehouse' },
      { id: 'sourcing', titleFa: 'تأمین مستقیم', titleEn: 'Direct Sourcing', descriptionFa: 'زنجیره تأمین ساده‌تر برای خرید صنعتی.', descriptionEn: 'A simpler sourcing path for industrial procurement.', icon: 'Coins' },
      { id: 'engineering', titleFa: 'مشاوره مهندسی', titleEn: 'Engineering Support', descriptionFa: 'راهنمایی در انتخاب تیپ، لقی و شرایط کاربرد.', descriptionEn: 'Guidance on bearing type, clearance, and application conditions.', icon: 'Cpu' },
      { id: 'commercial', titleFa: 'هماهنگی تجاری B2B', titleEn: 'B2B Coordination', descriptionFa: 'هماهنگی شرایط تأمین و تحویل برای مشتریان صنعتی.', descriptionEn: 'Supply and delivery coordination for industrial customers.', icon: 'Building2' },
      { id: 'dispatch', titleFa: 'ارسال ایمن', titleEn: 'Secure Dispatch', descriptionFa: 'بسته‌بندی و ارسال مناسب قطعات صنعتی.', descriptionEn: 'Appropriate packaging and dispatch for industrial components.', icon: 'Truck' },
    ],
  },
  industries: {
    tagFa: 'صنایع تحت پوشش',
    tagEn: 'Industries We Serve',
    titleFa: 'تأمین‌کننده صنایع مختلف کشور',
    titleEn: 'Supporting Diverse Industrial Applications',
    subtitleFa: 'قطعات دوار و آب‌بندی متناسب با محیط‌های عملیاتی مختلف.',
    subtitleEn: 'Rotating and sealing components for a range of industrial environments.',
    items: [
      { id: 'ind-auto', titleFa: 'خودروسازی و وسایل نقلیه سنگین', titleEn: 'Automotive & Heavy Fleet', descriptionFa: 'قطعات مرتبط با توپی، دینام، گیربکس و آب‌بندی.', descriptionEn: 'Components for hubs, alternators, transmissions, and sealing.', recommendedBearings: ['30208 J2/Q','6204-2RS','TC 35-52-10 NBR'], icon: 'Car' },
      { id: 'ind-mining', titleFa: 'معادن، سیمان و سنگ‌شکن‌ها', titleEn: 'Mining, Cement & Crushers', descriptionFa: 'برینگ‌های مناسب ارتعاش، بار سنگین و محیط‌های غبارآلود.', descriptionEn: 'Bearings for vibration, heavy loads, and dusty environments.', recommendedBearings: ['22212 EK','22316 CC/W33','SNL 511-609'], icon: 'Mountain' },
      { id: 'ind-steel', titleFa: 'صنایع فولاد و نورد فلزات', titleEn: 'Steel Mills & Rolling', descriptionFa: 'راهکارهای برینگ و آب‌بندی برای خطوط نورد و دمای بالا.', descriptionEn: 'Bearing and sealing solutions for rolling lines and elevated temperatures.', recommendedBearings: ['NU 208 ECP','32210 J2/Q','TC 50-72-8 Viton'], icon: 'Flame' },
      { id: 'ind-petro', titleFa: 'نفت، گاز و پتروشیمی', titleEn: 'Oil, Gas & Petrochemical', descriptionFa: 'قطعات مناسب پمپ‌ها و تجهیزات فرآیندی.', descriptionEn: 'Components for pumps and process equipment.', recommendedBearings: ['6310-2Z','6308-2Z C3','SNL 511-609'], icon: 'Fuel' },
      { id: 'ind-agri', titleFa: 'کشاورزی و صنایع غذایی', titleEn: 'Agriculture & Food Processing', descriptionFa: 'یاتاقان و برینگ برای ماشین‌آلات و خطوط انتقال.', descriptionEn: 'Bearing units for machinery and conveying systems.', recommendedBearings: ['UCP 205','UCF 208','6005 Open'], icon: 'Tractor' },
      { id: 'ind-electric', titleFa: 'الکتروموتورها، پمپ‌ها و ژنراتورها', titleEn: 'Motors, Pumps & Generators', descriptionFa: 'برینگ‌های دور بالا و گزینه‌های مناسب کاربردهای الکتریکی.', descriptionEn: 'High-speed bearing options for electrical rotating equipment.', recommendedBearings: ['6206-2RS1 C3','6308-2Z C3','NU 208 ECP'], icon: 'Zap' },
    ],
  },
  team: {
    tagFa: 'سرمایه انسانی پولاد چرخِش',
    tagEn: 'Our Team',
    titleFa: 'تیم مهندسی و مشاوران فنی',
    titleEn: 'Engineering & Technical Support Team',
    subtitleFa: 'اطلاعات این بخش از پنل مدیریت قابل ویرایش است.',
    subtitleEn: 'Team profiles in this section are managed from the admin portal.',
    members: [],
  },
  contact: {
    tagFa: 'ارتباط مستقیم و استعلام اطلاعات',
    tagEn: 'Direct Contact & Technical Inquiries',
    titleFa: 'آماده پاسخگویی و ارائه مشاوره فنی هستیم',
    titleEn: 'We Are Ready to Assist with Your Inquiry',
    subtitleFa: 'برای بررسی موجودی و مشخصات فنی با ما تماس بگیرید یا پیام ارسال کنید.',
    subtitleEn: 'Contact us for availability checks, technical information, or consultation.',
    infoTitleFa: 'اطلاعات رسمی تماس',
    infoTitleEn: 'Official Contact Information',
    consultationTitleFa: 'مشاوره فنی و استعلام سریع',
    consultationTitleEn: 'Technical Consultation & Fast Inquiry',
    consultationTextFa: 'کارشناسان ما برای بررسی کد قطعه، معادل‌سازی و شرایط کاربرد پاسخگو هستند.',
    consultationTextEn: 'Our team can help with part codes, cross-referencing, and application conditions.',
    formTitleFa: 'فرم استعلام و پیام',
    formTitleEn: 'Inquiry & Message Form',
    formSubtitleFa: 'اطلاعات تماس و شرح درخواست خود را وارد کنید.',
    formSubtitleEn: 'Enter your contact details and inquiry information.',
  },
  footer: {
    descriptionFa: 'تأمین و مشاوره فنی قطعات دوار، بیرینگ‌ها و آب‌بندهای صنعتی.',
    descriptionEn: 'Industrial bearing, rotating-component, and sealing supply with technical consultation.',
    copyrightFa: 'تمامی حقوق برای پولاد چرخِش محفوظ است.',
    copyrightEn: 'All rights reserved for Polad Charkhesh.',
    disclaimerFa: 'اطلاعات فنی سایت جنبه مرجع دارد؛ انتخاب نهایی باید با شرایط واقعی کاربرد تطبیق داده شود.',
    disclaimerEn: 'Technical information is for reference; final selection should be verified against actual operating conditions.',
  },
  visibility: {
    hero: true,
    about: true,
    catalog: true,
    tools: true,
    whyUs: true,
    industries: true,
    team: true,
    contact: true,
  },
};

export const DEFAULT_SEO_CONFIG: SiteSeoConfig = {
  defaultTitleFa: 'بازرگانی پولاد چرخِش | مرجع تخصصی تأمین بلبرینگ و رولبرینگ صنعتی',
  defaultTitleEn: 'Polad Charkhesh | Industrial Bearings & Engineering Supply',
  defaultDescriptionFa: 'تأمین مستقیم انواع بلبرینگ و رولبرینگ صنعتی، برینگ‌های شیار عمیق، مخروطی، بشکه‌ای، خودتنظیم و کف‌گرد با تضمین اصالت و مشخصات استاندارد DIN / ISO.',
  defaultDescriptionEn: 'Direct supplier of industrial ball & roller bearings, tapered, spherical, and thrust bearings with guaranteed authenticity and ISO 281 standards compliance.',
  canonicalBaseUrl: 'https://poladcharkhesh.ir',
  ogImageUrl: '/polad-og-banner.jpg',
  keywordsFa: ['بلبرینگ', 'رولبرینگ', 'بلبرینگ صنعتی', 'SKF', 'FAG', 'تأمین قطعات صنایع فولاد', 'کاتالوگ بلبرینگ'],
  keywordsEn: ['bearings', 'industrial bearings', 'SKF bearings', 'roller bearings', 'tapered roller bearing', 'ISO 281'],
  organizationNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  organizationNameEn: 'Polad Charkhesh Industrial Trading Co.',
  googleSiteVerification: '',
};

export type DataSyncStatus = 'loading' | 'synced' | 'degraded';

export interface DataSyncState {
  status: DataSyncStatus;
  isAuthoritative: boolean;
  lastSyncedAt?: string;
  error?: string;
}

class DataService {
  // Runtime authority is the SQLite-backed API.
  // Static canonical products are permitted only as an explicit development reference fallback.
  // Production must never silently present bundled product data as the current catalog.
  private products: BearingProduct[] = import.meta.env.PROD ? [] : [...canonicalProducts];
  private companyInfo: CompanyContactInfo = { ...canonicalCompanyInfo };
  private pageContent: CmsPageContent = { ...DEFAULT_PAGE_CONTENT };
  private seoConfig: SiteSeoConfig = { ...DEFAULT_SEO_CONFIG };
  private inquiries: InquiryLog[] = [];
  
  private syncState: DataSyncState = {
    status: 'loading',
    isAuthoritative: false,
  };

  private listeners: Set<() => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.cleanLegacyLocalStorage();
    this.init();
  }

  private cleanLegacyLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('polad_admin_products_v2');
      localStorage.removeItem('polad_admin_company_v2');
      localStorage.removeItem('polad_admin_content_v2');
      localStorage.removeItem('polad_admin_seo_v2');
      localStorage.removeItem('polad_admin_inquiries_v2');
      localStorage.removeItem('polad_admin_audit_logs_v1');
    } catch {}
  }

  private async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await this.refreshFromServer();
    } catch (err) {
      console.warn('[DataService] Initial backend sync failed, running in degraded mode:', err);
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Pull complete authoritative state from server API via domain services
   */
  public async refreshFromServer(): Promise<void> {
    try {
      const [prodRes, compRes, contentRes, seoRes] = await Promise.all([
        productService.getProducts(true),
        companyService.getCompanyInfo(),
        contentService.getContent(),
        seoService.getSeo(),
      ]);

      if (prodRes.success && prodRes.data?.products && Array.isArray(prodRes.data.products)) {
        this.products = prodRes.data.products;
        this.syncState = {
          status: 'synced',
          isAuthoritative: true,
          lastSyncedAt: new Date().toISOString(),
        };
      } else {
        this.syncState = {
          status: 'degraded',
          isAuthoritative: false,
          error: prodRes.success ? 'No products array returned from server' : prodRes.error.message,
        };
      }

      if (compRes.success && compRes.data?.company) {
        this.companyInfo = compRes.data.company;
      }
      if (contentRes.success && contentRes.data?.content) {
        this.pageContent = contentRes.data.content;
      }
      if (seoRes.success && seoRes.data?.seo) {
        this.seoConfig = seoRes.data.seo;
      }

      // Inquiries (requires admin session, gracefully fails for public users)
      try {
        const inqRes = await inquiryService.getInquiries();
        if (inqRes.success && Array.isArray(inqRes.data?.inquiries)) {
          this.inquiries = inqRes.data.inquiries;
        }
      } catch {}

      this.notifyListeners();
    } catch (err: any) {
      console.warn('[DataService] Server unreachable, running in degraded mode:', err?.message || err);
      this.syncState = {
        status: 'degraded',
        isAuthoritative: false,
        error: err?.message || 'Server connection failed',
      };
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in data listener:', e);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeToProducts(listener: (products: BearingProduct[]) => void): () => void {
    const handler = () => listener(this.getActiveProducts());
    listener(this.getActiveProducts());
    return this.subscribe(handler);
  }

  public subscribeToAllProducts(listener: (products: AdminProductItem[]) => void): () => void {
    const handler = () => listener(this.getAllProducts());
    listener(this.getAllProducts());
    return this.subscribe(handler);
  }

  public subscribeToCompany(listener: (company: CompanyContactInfo) => void): () => void {
    const handler = () => listener(this.getCompanyInfo());
    listener(this.getCompanyInfo());
    return this.subscribe(handler);
  }

  public subscribeToContent(listener: (content: CmsPageContent) => void): () => void {
    const handler = () => listener(this.getPageContent());
    listener(this.getPageContent());
    return this.subscribe(handler);
  }

  public subscribeToSeo(listener: (seo: SiteSeoConfig) => void): () => void {
    const handler = () => listener(this.getSeoConfig());
    listener(this.getSeoConfig());
    return this.subscribe(handler);
  }

  public subscribeToInquiries(listener: (inquiries: InquiryLog[]) => void): () => void {
    const handler = () => listener(this.getInquiries());
    listener(this.getInquiries());
    return this.subscribe(handler);
  }

  public getSyncState(): DataSyncState {
    return { ...this.syncState };
  }

  public isAuthoritative(): boolean {
    return this.syncState.isAuthoritative;
  }

  public subscribeToSyncState(listener: (state: DataSyncState) => void): () => void {
    const handler = () => listener(this.getSyncState());
    listener(this.getSyncState());
    return this.subscribe(handler);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  // ==========================================
  // PRODUCTS ACCESS & MUTATION
  // ==========================================

  public getActiveProducts(): BearingProduct[] {
    return this.products.filter((p) => !p.isArchived);
  }

  public getAllProducts(): AdminProductItem[] {
    return [...this.products];
  }

  public getProductById(id: string): BearingProduct | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getProductBySlug(slug: string): BearingProduct | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  public async addProduct(
    product: any,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; product?: BearingProduct; errors?: string[] }> {
    const res = await productService.createProduct(product);
    if (!res.success) {
      return { success: false, errors: [res.error.message] };
    }

    const created = res.data.product;
    this.products.unshift(created);
    this.notifyListeners();
    return { success: true, product: created };
  }

  public async updateProduct(
    id: string,
    updates: any,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; product?: BearingProduct; errors?: string[] }> {
    const res = await productService.updateProduct(id, updates);
    if (!res.success) {
      return { success: false, errors: [res.error.message] };
    }

    const updated = res.data.product;
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.products[idx] = updated;
    }
    this.notifyListeners();
    return { success: true, product: updated };
  }

  public async deleteProduct(id: string, _user?: AdminUser | string): Promise<{ success: boolean; error?: string }> {
    const res = await productService.deleteProduct(id);
    if (!res.success) {
      return { success: false, error: res.error.message };
    }

    this.products = this.products.filter((p) => p.id !== id);
    this.notifyListeners();
    return { success: true };
  }

  public async setArchiveProduct(
    id: string,
    isArchived: boolean,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; isArchived?: boolean; error?: string }> {
    const res = await productService.setArchiveStatus(id, isArchived);
    if (!res.success) {
      return { success: false, error: res.error.message };
    }

    const product = this.products.find((p) => p.id === id);
    if (product) {
      product.isArchived = res.data.isArchived;
    }
    this.notifyListeners();
    return { success: true, isArchived: res.data.isArchived };
  }

  public async toggleArchiveProduct(
    id: string,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; isArchived?: boolean; error?: string }> {
    const product = this.products.find((p) => p.id === id);
    const targetState = product ? !product.isArchived : true;
    return this.setArchiveProduct(id, targetState, _user);
  }

  public async duplicateProduct(
    id: string,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; product?: BearingProduct; error?: string }> {
    const res = await productService.duplicateProduct(id);
    if (!res.success) {
      return { success: false, error: res.error.message };
    }

    const cloned = res.data.product;
    this.products.unshift(cloned);
    this.notifyListeners();
    return { success: true, product: cloned };
  }

  public async toggleFeaturedProduct(
    id: string,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; featured?: boolean }> {
    const product = this.products.find((p) => p.id === id);
    const newFeatured = !Boolean(product?.featured);

    const res = await productService.setFeaturedStatus(id, newFeatured);
    if (!res.success) {
      return { success: false };
    }

    if (product) {
      product.featured = res.data.featured;
    }
    this.notifyListeners();
    return { success: true, featured: res.data.featured };
  }

  public async toggleStockProduct(
    id: string,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; inStock?: boolean }> {
    const product = this.products.find((p) => p.id === id);
    const newStock = !Boolean(product?.inStock);

    const res = await productService.setStockStatus(id, newStock);
    if (!res.success) {
      return { success: false };
    }

    if (product) {
      product.inStock = res.data.inStock;
    }
    this.notifyListeners();
    return { success: true, inStock: res.data.inStock };
  }

  // ==========================================
  // COMPANY & CMS & SEO
  // ==========================================

  public getCompanyInfo(): CompanyContactInfo {
    return { ...this.companyInfo };
  }

  public async updateCompanyInfo(
    updates: Partial<CompanyContactInfo>,
    _user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    const res = await companyService.updateCompanyInfo(updates);
    if (!res.success) {
      return { success: false };
    }

    this.companyInfo = res.data.company;
    this.notifyListeners();
    return { success: true };
  }

  public getContent(): CmsPageContent {
    return this.getPageContent();
  }

  public async updateContent(
    updates: Partial<CmsPageContent>,
    user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    return this.updatePageContent(updates, user);
  }

  public getPageContent(): CmsPageContent {
    return { ...this.pageContent };
  }

  public async updatePageContent(
    updates: Partial<CmsPageContent>,
    _user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    const res = await contentService.updateContent(updates);
    if (!res.success) {
      return { success: false };
    }

    this.pageContent = res.data.content;
    this.notifyListeners();
    return { success: true };
  }

  public getSeoConfig(): SiteSeoConfig {
    return { ...this.seoConfig };
  }

  public async updateSeoConfig(
    updates: Partial<SiteSeoConfig>,
    _user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    const res = await seoService.updateSeo(updates);
    if (!res.success) {
      return { success: false };
    }

    this.seoConfig = res.data.seo;
    this.notifyListeners();
    return { success: true };
  }

  // ==========================================
  // INQUIRIES
  // ==========================================

  public getInquiries(): InquiryLog[] {
    return [...this.inquiries];
  }

  public async recordInquiry(data: {
    fullName: string;
    phone: string;
    message: string;
    company?: string;
    email?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.submitInquiry(data);
  }

  public async submitInquiry(data: {
    fullName: string;
    phone: string;
    message: string;
    company?: string;
    email?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const res = await inquiryService.submitInquiry(data);
    if (!res.success) {
      return { success: false, error: res.error.message };
    }

    const newInquiry: InquiryLog = {
      id: res.data.id,
      timestamp: new Date().toISOString(),
      fullName: data.fullName,
      phone: data.phone,
      message: data.message,
      company: data.company,
      email: data.email,
      status: 'new',
    };
    this.inquiries.unshift(newInquiry);
    this.notifyListeners();

    return { success: true, id: res.data.id };
  }

  public async updateInquiryStatus(
    id: string,
    status: InquiryLog['status']
  ): Promise<{ success: boolean }> {
    const res = await inquiryService.updateStatus(id, status);
    if (!res.success) {
      return { success: false };
    }

    const item = this.inquiries.find((i) => i.id === id);
    if (item) {
      item.status = status;
      this.notifyListeners();
    }
    return { success: true };
  }

  // ==========================================
  // BACKUP, RESTORE & RESET
  // ==========================================

  public async exportSnapshot(): Promise<DatasetSnapshot> {
    const res = await systemService.exportBackup();
    if (!res.success) {
      throw new Error(res.error.message || 'خطا در دریافت فایل پشتیبان از سرور.');
    }
    return res.data;
  }

  public async importSnapshot(
    jsonString: string,
    _user?: AdminUser | string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const parsed = JSON.parse(jsonString);
      const res = await systemService.restoreBackup(parsed);
      if (!res.success) {
        return { success: false, errors: [res.error.message || 'خطا در بازیابی نسخه پشتیبان.'] };
      }

      await this.refreshFromServer();
      return { success: true };
    } catch (err: any) {
      return { success: false, errors: [err.message || 'فایل پشتیبان نامعتبر است.'] };
    }
  }

  public async resetToCanonical(_user?: AdminUser | string): Promise<{ success: boolean }> {
    // Note: factory reset requires username/password on the backend for superadmin verification
    // Calling via systemService
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return { success: false };

    // If caller needs credentials, systemService.factoryReset is used
    return { success: false };
  }
}

export const dataService = new DataService();

/**
 * React hook to reactively subscribe to active products from SQLite backend via dataService
 */
/**
 * React hook to reactively subscribe to backend synchronization state
 */
export function useDataSync(): DataSyncState {
  const [syncState, setSyncState] = useState<DataSyncState>(() => dataService.getSyncState());
  useEffect(() => {
    return dataService.subscribeToSyncState(setSyncState);
  }, []);
  return syncState;
}

export function useActiveProducts(): BearingProduct[] {
  const [products, setProducts] = useState<BearingProduct[]>(() => dataService.getActiveProducts());
  useEffect(() => {
    return dataService.subscribeToProducts(setProducts);
  }, []);
  return products;
}

/**
 * React hook to reactively subscribe to authoritative company contact info
 */
export function useCompanyInfo(): CompanyContactInfo {
  const [info, setInfo] = useState<CompanyContactInfo>(() => dataService.getCompanyInfo());
  useEffect(() => {
    return dataService.subscribeToCompany(setInfo);
  }, []);
  return info;
}

/**
 * React hook to reactively subscribe to authoritative CMS page content
 */
export function usePageContent(): CmsPageContent {
  const [content, setContent] = useState<CmsPageContent>(() => dataService.getPageContent());
  useEffect(() => {
    return dataService.subscribeToContent(setContent);
  }, []);
  return content;
}

/**
 * React hook to reactively subscribe to authoritative SEO config
 */
export function useSeoConfig(): SiteSeoConfig {
  const [seo, setSeo] = useState<SiteSeoConfig>(() => dataService.getSeoConfig());
  useEffect(() => {
    return dataService.subscribeToSeo(setSeo);
  }, []);
  return seo;
}
