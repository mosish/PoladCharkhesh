/**
 * POLAD CHARKHESH - FUTURE ADMIN DATA CONTRACT (ARCHITECTURE SPECIFICATION)
 * 
 * This contract defines the typed data structures, payload schemas, and
 * interfaces that the future Admin Panel, CMS, or backend management layer
 * will require to manage Products, Categories, Media Assets, Company Settings,
 * Page Content, and SEO configurations.
 * 
 * IMPORTANT: This is a design/architecture contract. No database or auth
 * is provisioned in this phase.
 */

import { BearingCategory, BearingSchematicType, TechnicalSource } from '../types';

// ==========================================
// 1. PRODUCT MANAGEMENT CONTRACT
// ==========================================

export interface AdminProductDraft {
  id?: string; // Optional for creation; generated on publish
  slug?: string;
  code: string; // e.g. "6204-2RSH / 2RS1"
  category: BearingCategory; // Must be engineering-type based
  status: 'draft' | 'published' | 'archived';
  inStock: boolean;
  featured: boolean;
  
  // Localized Content
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  
  // Boundary Dimensions (ISO 15 / ISO 355)
  d: number; // Bore (mm)
  D: number; // Outside Diameter (mm)
  B: number; // Width / Height (mm)
  weightKg: number;
  rMin?: number;
  contactAngle?: string;
  
  // Load & Speed Ratings (ISO 76 / ISO 281)
  crKn: number; // Basic dynamic radial load rating (kN)
  corKn: number; // Basic static radial load rating (kN)
  speedGreaseRpm: number;
  speedOilRpm: number;
  thermalSpeedRatingRpm?: number;
  speedReferenceType?: 'limiting' | 'thermal' | 'both';
  
  // Mechanical Construction
  cageMaterialFa: string;
  cageMaterialEn: string;
  sealingFa: string;
  sealingEn: string;
  clearanceOptions: string[]; // e.g. ['CN', 'C3', 'C4']
  schematicType: BearingSchematicType;
  
  // Media References
  imageUrl?: string;
  images?: string[];
  pdfUrl?: string;
  
  // Metadata & Associations
  brands: string[]; // Brand availability (e.g. ['SKF', 'FAG', 'TIMKEN'])
  applicationsFa: string[];
  applicationsEn: string[];
  industryIds?: string[];
  
  // Verification & Audit Trail
  technicalSources?: TechnicalSource[];
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  
  // SEO Overrides (optional)
  metaTitleFa?: string;
  metaTitleEn?: string;
  metaDescriptionFa?: string;
  metaDescriptionEn?: string;
}

// ==========================================
// 2. CATEGORY ARCHITECTURE CONTRACT
// ==========================================

export interface AdminCategoryDefinition {
  id: BearingCategory;
  slug: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  applicableStandards: string[]; // e.g. ['ISO 15', 'DIN 625', 'ISO 355']
}

// ==========================================
// 3. MEDIA ASSET MANAGEMENT CONTRACT
// ==========================================

export interface AdminMediaAsset {
  id: string;
  fileName: string;
  fileSizeKb: number;
  mimeType: 'image/webp' | 'image/png' | 'image/jpeg' | 'application/pdf';
  url: string;
  altTextFa: string;
  altTextEn: string;
  category: 'product_photo' | 'cad_schematic' | 'datasheet_pdf' | 'company_photo';
  associatedProductCodes?: string[];
  uploadedAt: string;
}

// ==========================================
// 4. COMPANY & CONTACT INFORMATION CONTRACT
// ==========================================

export interface AdminCompanySettings {
  nameFa: string;
  nameEn: string;
  legalNameFa: string;
  legalNameEn: string;
  sloganFa: string;
  sloganEn: string;
  website: string;
  email: string;
  
  // Telephony
  primaryPhone: string;
  primaryPhoneDisplayFa: string;
  primaryPhoneDisplayEn: string;
  landlinePhone: string;
  landlinePhoneDisplayFa: string;
  landlinePhoneDisplayEn: string;
  whatsappNumber: string;
  whatsappUrl: string;
  
  // Physical Location
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
  
  // Working Hours
  workingHoursFa: string;
  workingHoursEn: string;
  workingHoursShortFa: string;
  workingHoursShortEn: string;
  
  // Navigation & Social
  maps: {
    google: string;
    neshan: string;
    balad: string;
  };
}

// ==========================================
// 5. EDITABLE PAGE CONTENT CONTRACT
// ==========================================

export interface AdminHeroContent {
  badgeFa: string;
  badgeEn: string;
  missionStatementFa: string;
  missionStatementEn: string;
  stats: Array<{
    id: string;
    numberFa: string;
    numberEn: string;
    labelFa: string;
    labelEn: string;
  }>;
}

export interface AdminAboutContent {
  tagFa: string;
  tagEn: string;
  titleFa: string;
  titleEn: string;
  p1Fa: string;
  p1En: string;
  p2Fa: string;
  p2En: string;
  missionTitleFa: string;
  missionTitleEn: string;
  missionTextFa: string;
  missionTextEn: string;
}

export interface AdminPageContentConfig {
  hero: AdminHeroContent;
  about: AdminAboutContent;
}

// ==========================================
// 6. GLOBAL SEO & STRUCTURED DATA CONTRACT
// ==========================================

export interface AdminSeoConfig {
  defaultTitleFa: string;
  defaultTitleEn: string;
  defaultMetaDescriptionFa: string;
  defaultMetaDescriptionEn: string;
  siteUrl: string;
  sitemapAutoGenerate: boolean;
  ogImageDefault: string;
  twitterHandle?: string;
}

// ==========================================
// 7. AUDIT & ACCESS LOG CONTRACT
// ==========================================

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: 'create_product' | 'update_product' | 'delete_product' | 'update_settings' | 'upload_media';
  targetEntity: 'product' | 'company_info' | 'media' | 'content';
  targetId: string;
  summary: string;
}
