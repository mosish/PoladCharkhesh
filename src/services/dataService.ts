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
    badgeFa: 'مرجع تخصصی بلبرینگ و رولبرینگ صنعتی در ایران',
    badgeEn: 'Specialized Industrial Bearings & Power Transmission Hub',
    titleHighlightFa: 'تأمین مهندسی',
    titleHighlightEn: 'Engineering Supply',
    titleSuffixFa: 'انواع بلبرینگ‌های اورجینال صنایع سنگین',
    titleSuffixEn: 'of Heavy Industrial Bearings',
    descriptionFa: 'تأمین مستقیم انواع بیرینگ‌های فوق دقیق، توربین، آسیاب، پمپ و گیربکس از برترین برندهای معتبر جهان (SKF, FAG, NSK, TIMKEN) با تضمین اصالت و شناسنامه فنی کالا.',
    descriptionEn: 'Direct procurement of precision bearings for turbines, mills, pumps, and gearboxes from world-class manufacturers (SKF, FAG, NSK, TIMKEN) with verified certificates.',
    searchPlaceholderFa: 'جستجو بر اساس شماره فنی کالا، ابعاد مهندسی یا دسته‌بندی...',
    searchPlaceholderEn: 'Search by technical bearing code, dimensions, or category...',
  },
  about: {
    tagFa: 'اصالت و اعتبار مهندسی',
    tagEn: 'ENGINEERING HERITAGE & TRUST',
    titleFa: 'بیش از دو دهه تجربه در قلب صنعت کشور',
    titleEn: 'Over Two Decades of Core Industrial Expertise',
    paragraph1Fa: 'بازرگانی صنعتی پولاد چرخِش با اتکا به دانش مهندسی متالورژی و شناخت دقیق نیازمندی‌های کارخانجات فولاد، سیمان، نفت و پتروشیمی، همواره مطمئن‌ترین همراه صنایع مادر ایران در تأمین قطعات حساس دوار بوده است.',
    paragraph1En: 'Polad Charkhesh Industrial Trading leverages metallurgical expertise and in-depth understanding of steel, cement, oil, and petrochemical plants to reliably supply critical rotating equipment.',
    paragraph2Fa: 'ما با ایجاد زنجیره تأمین مستقیم بین‌المللی و آزمایشگاه کنترل کیفیت ابعادی و ارتعاشاتی، هرگونه ریسک خرابی زودرس و توقف خطوط تولید را به صفر نزدیک می‌کنیم.',
    paragraph2En: 'Through direct global procurement and stringent dimensional/vibrational quality control, we minimize unexpected downtime risks for industrial manufacturing lines.',
    stats: [
      { valueFa: '۲۲+', valueEn: '22+', labelFa: 'سال سابقه تخصصی', labelEn: 'Years Experience' },
      { valueFa: '۱۰۰٪', valueEn: '100%', labelFa: 'تضمین اصالت کالا', labelEn: 'Authenticity Guarantee' },
      { valueFa: '۶۸+', valueEn: '68+', labelFa: 'شماره فنی در انبار دائم', labelEn: 'Audited Product Lines' },
      { valueFa: '۲۴/۷', valueEn: '24/7', labelFa: 'پشتیبانی فنی مهندسی', labelEn: 'Engineering Support' },
    ],
  },
  footer: {
    descriptionFa: 'مرکز تخصصی تأمین و مشاوره فنی انواع بیرینگ‌های صنعتی، گریس‌های تخصصی و کاسه‌نمدهای اورجینال صنایع نفت، گاز، پتروشیمی، فولاد و سیمان.',
    descriptionEn: 'Specialized industrial supplier of certified bearings, premium lubricants, and heavy-duty mechanical seals.',
    copyrightFa: 'تمامی حقوق مادی و معنوی برای بازرگانی صنعتی پولاد چرخِش محفوظ است.',
    copyrightEn: 'All rights reserved for Polad Charkhesh Industrial Trading Co.',
    disclaimerFa: 'اطلاعات فنی ارائه شده در این پلتفرم بر اساس استانداردهای DIN و ISO 281 گردآوری شده و جنبه مرجع مهندسی دارد.',
    disclaimerEn: 'Technical specifications are compiled according to DIN and ISO 281 engineering standards.',
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
  // Authoritative runtime dataset (sourced directly from SQLite backend API)
  private products: BearingProduct[] = [...canonicalProducts];
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
