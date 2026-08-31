export type Language = 'fa' | 'en';
export type Theme = 'light' | 'dark';

// Engineering-focused product categories (NOT brand-based)
export type BearingCategory = 
  | 'ball' 
  | 'roller' 
  | 'spherical' 
  | 'cylindrical' 
  | 'thrust' 
  | 'housing' 
  | 'seal' 
  | 'lubricant';

export type BearingSchematicType = 
  | 'deep-groove' 
  | 'tapered' 
  | 'spherical' 
  | 'cylindrical' 
  | 'thrust' 
  | 'pillow-block' 
  | 'oil-seal';

export interface TechnicalSource {
  manufacturer: string;
  sourceType: 'official_catalog' | 'official_product_table' | 'engineering_manual' | 'industry_standard';
  catalogCode?: string;
  reference: string;
  verifiedAt: string;
}

// 1. Identity Sub-Contract
export interface ProductIdentity {
  id: string;
  slug?: string;
  code: string;
  category: BearingCategory;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  inStock: boolean;
  featured?: boolean;
}

// 2. Technical Specifications Sub-Contract
export interface ProductTechnicalSpecs {
  d: number; // Inner diameter (mm)
  D: number; // Outer diameter (mm)
  B: number; // Width / Thickness (mm)
  weightKg: number;
  crKn: number; // Dynamic load rating (kN)
  corKn: number; // Static load rating (kN)
  speedGreaseRpm: number;
  speedOilRpm: number;
  thermalSpeedRatingRpm?: number;
  speedReferenceType?: 'limiting' | 'thermal' | 'both';
  cageMaterialFa: string;
  cageMaterialEn: string;
  sealingFa: string;
  sealingEn: string;
  clearanceOptions: string[];
  schematicType: BearingSchematicType;
  rMin?: number; // Minimum chamfer radius (mm)
  contactAngle?: string; // e.g. "40°", "15°"
}

// 3. Media Sub-Contract
export interface ProductMedia {
  imageUrl?: string;
  images?: string[];
  pdfUrl?: string;
}

// 4. Applications & Industries Sub-Contract
export interface ProductApplications {
  applicationsFa: string[];
  applicationsEn: string[];
  industryIds?: string[];
}

// 5. Brands / Suppliers Metadata (Metadata ONLY, never a category)
export interface ProductBrandMetadata {
  brands: string[];
}

// 6. SEO Metadata Sub-Contract
export interface ProductSeoMetadata {
  metaTitleFa?: string;
  metaTitleEn?: string;
  metaDescriptionFa?: string;
  metaDescriptionEn?: string;
  keywords?: string[];
}

// Complete Unified BearingProduct Interface (Fully backward compatible with all components)
export interface BearingProduct extends 
  ProductIdentity, 
  ProductTechnicalSpecs, 
  ProductMedia, 
  ProductApplications, 
  ProductBrandMetadata, 
  ProductSeoMetadata {
  technicalSources?: TechnicalSource[];
}

export interface TeamMember {
  id: string;
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  experienceFa: string;
  experienceEn: string;
  specialtyFa: string;
  specialtyEn: string;
  phone?: string;
  email?: string;
  image: string;
}

export interface IndustryApplication {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  recommendedBearings: string[];
  icon: string;
}
