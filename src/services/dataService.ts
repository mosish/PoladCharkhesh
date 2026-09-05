/**
 * POLAD CHARKHESH - CENTRALIZED DATA SERVICE & STORE
 * 
 * Production server-backed data architecture:
 * All product records, company information, CMS pages, SEO metadata,
 * and contact inquiries are persistently managed via the Express + SQLite backend.
 * 
 * In-memory caching and reactive subscription ensure instantaneous, flicker-free
 * rendering across the entire application with reliable server synchronization.
 */

import { BearingProduct } from '../types';
import { bearingProducts as canonicalProducts } from '../data/products';
import { COMPANY_INFO as canonicalCompanyInfo, CompanyContactInfo } from '../data/company';
import { 
  AdminProductItem, 
  CmsPageContent, 
  SiteSeoConfig, 
  DatasetSnapshot,
  InquiryLog,
  AdminUser 
} from '../types/admin';
import { validateProductDataset } from '../utils/productValidation';
import { getProductSlug } from '../utils/productSlug';
import { auditService } from './auditService';

// Default Page Content Baseline
export const DEFAULT_PAGE_CONTENT: CmsPageContent = {
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
export const DEFAULT_SEO_CONFIG: SiteSeoConfig = {
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
  private products: BearingProduct[] = [...canonicalProducts];
  private companyInfo: CompanyContactInfo = { ...canonicalCompanyInfo };
  private pageContent: CmsPageContent = { ...DEFAULT_PAGE_CONTENT };
  private seoConfig: SiteSeoConfig = { ...DEFAULT_SEO_CONFIG };
  private inquiries: InquiryLog[] = [];
  
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
      console.warn('Initial backend sync failed, using canonical dataset baseline:', err);
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Pull complete authoritative state from server API
   */
  public async refreshFromServer(): Promise<void> {
    try {
      const [prodRes, compRes, contentRes, seoRes] = await Promise.all([
        fetch('/api/products?includeArchived=true', { credentials: 'include' }),
        fetch('/api/company', { credentials: 'include' }),
        fetch('/api/content', { credentials: 'include' }),
        fetch('/api/seo', { credentials: 'include' }),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData.products) && prodData.products.length > 0) {
          this.products = prodData.products;
        }
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.company) {
          this.companyInfo = compData.company;
        }
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        if (contentData.content) {
          this.pageContent = contentData.content;
        }
      }

      if (seoRes.ok) {
        const seoData = await seoRes.json();
        if (seoData.seo) {
          this.seoConfig = seoData.seo;
        }
      }

      // Try fetching inquiries if authenticated
      try {
        const inqRes = await fetch('/api/inquiries', { credentials: 'include' });
        if (inqRes.ok) {
          const inqData = await inqRes.json();
          if (Array.isArray(inqData.inquiries)) {
            this.inquiries = inqData.inquiries;
          }
        }
      } catch {}

      this.notifyListeners();
    } catch (err) {
      console.error('refreshFromServer error:', err);
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
    product: Partial<BearingProduct>,
    user?: AdminUser | string
  ): Promise<{ success: boolean; product?: BearingProduct; errors?: string[] }> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(product),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, errors: data.errors || [data.error || 'خطا در ثبت کالا'] };
      }

      const created = data.product as BearingProduct;
      this.products.unshift(created);
      this.notifyListeners();

      return { success: true, product: created };
    } catch (err: any) {
      return { success: false, errors: ['خطا در ارتباط با سرور پایگاه داده.'] };
    }
  }

  public async updateProduct(
    id: string,
    updates: Partial<BearingProduct>,
    user?: AdminUser | string
  ): Promise<{ success: boolean; product?: BearingProduct; errors?: string[] }> {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, errors: data.errors || [data.error || 'خطا در ویرایش کالا'] };
      }

      const updated = data.product as BearingProduct;
      const idx = this.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        this.products[idx] = updated;
      }
      this.notifyListeners();

      return { success: true, product: updated };
    } catch (err: any) {
      return { success: false, errors: ['خطا در ارتباط با سرور پایگاه داده.'] };
    }
  }

  public async deleteProduct(id: string, user?: AdminUser | string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'خطا در حذف کالا' };
      }

      this.products = this.products.filter((p) => p.id !== id);
      this.notifyListeners();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'خطا در ارتباط با سرور.' };
    }
  }

  public async toggleArchiveProduct(
    id: string,
    user?: AdminUser | string
  ): Promise<{ success: boolean; isArchived?: boolean }> {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}/archive`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false };
      }

      const product = this.products.find((p) => p.id === id);
      if (product) {
        product.isArchived = data.isArchived;
      }
      this.notifyListeners();

      return { success: true, isArchived: data.isArchived };
    } catch {
      return { success: false };
    }
  }

  // ==========================================
  // COMPANY & CMS & SEO
  // ==========================================

  public getCompanyInfo(): CompanyContactInfo {
    return { ...this.companyInfo };
  }

  public async updateCompanyInfo(
    updates: Partial<CompanyContactInfo>,
    user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false };
      }

      this.companyInfo = data.company;
      this.notifyListeners();
      return { success: true };
    } catch {
      return { success: false };
    }
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
    user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false };
      }

      this.pageContent = data.content;
      this.notifyListeners();
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  public getSeoConfig(): SiteSeoConfig {
    return { ...this.seoConfig };
  }

  public async updateSeoConfig(
    updates: Partial<SiteSeoConfig>,
    user?: AdminUser | string
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false };
      }

      this.seoConfig = data.seo;
      this.notifyListeners();
      return { success: true };
    } catch {
      return { success: false };
    }
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
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        return { success: false, error: result.error || 'خطا در ثبت استعلام.' };
      }

      const newInquiry: InquiryLog = {
        id: result.id,
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

      return { success: true, id: result.id };
    } catch {
      return { success: false, error: 'خطا در برقراری ارتباط با سرور.' };
    }
  }

  public async updateInquiryStatus(
    id: string,
    status: InquiryLog['status']
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });

      if (!res.ok) return { success: false };

      const item = this.inquiries.find((i) => i.id === id);
      if (item) {
        item.status = status;
        this.notifyListeners();
      }
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // ==========================================
  // BACKUP, RESTORE & RESET
  // ==========================================

  public async exportSnapshot(): Promise<DatasetSnapshot> {
    const res = await fetch('/api/system/backup', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('خطا در دریافت فایل پشتیبان از سرور.');
    }
    return await res.json();
  }

  public async importSnapshot(
    jsonString: string,
    user?: AdminUser | string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const parsed = JSON.parse(jsonString);
      const res = await fetch('/api/system/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(parsed),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, errors: [data.error || 'خطا در بازیابی نسخه پشتیبان.'] };
      }

      await this.refreshFromServer();
      return { success: true };
    } catch (err: any) {
      return { success: false, errors: [err.message || 'فایل پشتیبان نامعتبر است.'] };
    }
  }

  public async resetToCanonical(user?: AdminUser | string): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/system/factory-reset', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false };
      }

      await this.refreshFromServer();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const dataService = new DataService();
