import { BearingProduct, BearingCategory, BearingSchematicType, TechnicalSource } from '../types';
import { CompanyContactInfo } from '../data/company';

// ==========================================
// 1. API RESPONSE CONTRACTS
// ==========================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error?: undefined;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  data?: undefined;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==========================================
// 2. AUTHENTICATION & USER CONTRACTS
// ==========================================

export type AdminRole = 'superadmin' | 'editor';

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: AdminRole;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Public/client session representation.
 * CRITICAL SECURITY INVARIANT:
 * Zero password hashes, session tokens, or private secrets are exposed.
 */
export interface AuthSession {
  user: AdminUser;
  expiresAt: number; // Unix timestamp ms
  issuedAt: number;
}

export interface AdminUserState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  isSessionExpired: boolean;
  expiresAt?: number;
  isConfigured?: boolean;
}

// ==========================================
// 3. AUDIT LOG CONTRACTS
// ==========================================

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
  details?: Record<string, unknown>;
  performedBy: string;
  ipAddress?: string;
}

// ==========================================
// 4. CMS & PAGE CONTENT CONTRACTS
// ==========================================

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

export type CmsUpdateInput = Partial<{
  hero: Partial<CmsHeroContent>;
  about: Partial<CmsAboutContent>;
  footer: Partial<CmsFooterContent>;
}>;

// ==========================================
// 5. SEO & SEARCH CONTRACTS
// ==========================================

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

export type SeoUpdateInput = Partial<SiteSeoConfig>;

// ==========================================
// 6. INQUIRIES & RFQ CONTRACTS
// ==========================================

export type InquiryStatus = 'new' | 'reviewed' | 'contacted' | 'closed';

export interface InquiryLog {
  id: string;
  timestamp: string;
  fullName: string;
  phone: string;
  message: string;
  company?: string;
  email?: string;
  status: InquiryStatus;
  ipAddress?: string;
}

export interface InquiryStatusUpdateInput {
  status: InquiryStatus;
}

export interface InquirySubmissionInput {
  fullName: string;
  phone: string;
  message?: string;
  company?: string;
  email?: string;
}

// ==========================================
// 7. MEDIA METADATA CONTRACTS
// ==========================================

export type MediaCategory = 'product_photo' | 'cad_schematic' | 'datasheet_pdf' | 'company_photo';

export interface MediaMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
  createdBy?: string;
  altTextFa?: string;
  altTextEn?: string;
  category?: MediaCategory;
  associatedProductCodes?: string[];
}

export interface MediaUploadInput {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altTextFa?: string;
  altTextEn?: string;
  category?: MediaCategory;
}

// ==========================================
// 8. PRODUCT CONTRACTS & INPUTS
// ==========================================

export interface AdminProductItem extends BearingProduct {
  isArchived?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ProductCreateInput {
  code: string;
  category: BearingCategory;
  nameFa: string;
  nameEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
  inStock?: boolean;
  featured?: boolean;
  d: number;
  D: number;
  B: number;
  weightKg?: number;
  crKn: number;
  corKn: number;
  speedGreaseRpm: number;
  speedOilRpm: number;
  thermalSpeedRatingRpm?: number;
  cageMaterialFa?: string;
  cageMaterialEn?: string;
  sealingFa?: string;
  sealingEn?: string;
  clearanceOptions?: string[];
  schematicType?: BearingSchematicType;
  rMin?: number;
  calculationFactorE?: number;
  calculationFactorY?: number;
  calculationFactorY0?: number;
  calculationFactorY1?: number;
  calculationFactorY2?: number;
  calculationFactorF0?: number;
  imageUrl?: string;
  images?: string[];
  pdfUrl?: string;
  brands?: string[];
  applicationsFa?: string[];
  applicationsEn?: string[];
  industryIds?: string[];
  technicalSources?: TechnicalSource[];
  metaTitleFa?: string;
  metaTitleEn?: string;
  metaDescriptionFa?: string;
  metaDescriptionEn?: string;
}

export type ProductUpdateInput = Partial<ProductCreateInput> & {
  isArchived?: boolean;
};

// ==========================================
// 9. BACKUP & SYSTEM CONTRACTS
// ==========================================

export interface DatasetSnapshot {
  version: string;
  exportedAt: string;
  exportedBy: string;
  products: AdminProductItem[];
  companyInfo: CompanyContactInfo;
  pageContent: CmsPageContent;
  seoConfig: SiteSeoConfig;
  auditLogsCount: number;
  inquiriesCount?: number;
}

// Aliases for unified imports
export type Product = BearingProduct;
export type CompanyInfo = CompanyContactInfo;
export type CompanyUpdateInput = Partial<CompanyContactInfo>;
export type CmsContent = CmsPageContent;
export type SeoConfig = SiteSeoConfig;
export type Inquiry = InquiryLog;
export type BackupSnapshot = DatasetSnapshot;
