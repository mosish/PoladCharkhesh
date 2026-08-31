import { BearingProduct } from '../types';
import { CompanyContactInfo } from '../data/company';

export type AdminRole = 'superadmin' | 'editor';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  token: string;
  user: AdminUser;
  expiresAt: number; // Unix timestamp ms
  issuedAt: number;
}

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'PASSWORD_CHANGED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_ARCHIVED'
  | 'PRODUCT_RESTORED'
  | 'PRODUCT_DELETED'
  | 'COMPANY_UPDATED'
  | 'CONTENT_UPDATED'
  | 'SEO_UPDATED'
  | 'MEDIA_UPDATED'
  | 'BACKUP_EXPORTED'
  | 'BACKUP_IMPORTED'
  | 'SYSTEM_RESET';

export type AuditEntity = 
  | 'auth'
  | 'product'
  | 'company'
  | 'content'
  | 'seo'
  | 'media'
  | 'system';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  summary: string;
  details?: Record<string, any>;
  performedBy: string;
}

export interface CmsHeroContent {
  badgeFa: string;
  badgeEn: string;
  titleHighlightFa: string;
  titleHighlightEn: string;
  titleSuffixFa: string;
  titleSuffixEn: string;
  descriptionFa: string;
  descriptionEn: string;
  searchPlaceholderFa: string;
  searchPlaceholderEn: string;
}

export interface CmsAboutContent {
  tagFa: string;
  tagEn: string;
  titleFa: string;
  titleEn: string;
  paragraph1Fa: string;
  paragraph1En: string;
  paragraph2Fa: string;
  paragraph2En: string;
  stats: Array<{
    valueFa: string;
    valueEn: string;
    labelFa: string;
    labelEn: string;
  }>;
}

export interface CmsFooterContent {
  descriptionFa: string;
  descriptionEn: string;
  copyrightFa: string;
  copyrightEn: string;
  disclaimerFa: string;
  disclaimerEn: string;
}

export interface CmsPageContent {
  hero: CmsHeroContent;
  about: CmsAboutContent;
  footer: CmsFooterContent;
}

export interface SiteSeoConfig {
  defaultTitleFa: string;
  defaultTitleEn: string;
  defaultDescriptionFa: string;
  defaultDescriptionEn: string;
  canonicalBaseUrl: string;
  ogImageUrl: string;
  keywordsFa: string[];
  keywordsEn: string[];
  organizationNameFa: string;
  organizationNameEn: string;
  googleSiteVerification?: string;
}

export interface InquiryLog {
  id: string;
  timestamp: string;
  fullName: string;
  phone: string;
  message: string;
  company?: string;
  email?: string;
  status: 'new' | 'reviewed' | 'contacted' | 'closed';
}

export interface AdminProductItem extends BearingProduct {
  isArchived?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DatasetSnapshot {
  version: string;
  exportedAt: string;
  exportedBy: string;
  products: AdminProductItem[];
  companyInfo: CompanyContactInfo;
  pageContent: CmsPageContent;
  seoConfig: SiteSeoConfig;
  auditLogsCount: number;
}

// Aliases for clean component imports
export type CompanyInfo = CompanyContactInfo;
export type CmsContent = CmsPageContent;
export type SeoConfig = SiteSeoConfig;
