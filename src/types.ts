export type Language = 'fa' | 'en';
export type Theme = 'light' | 'dark';

export interface TechnicalSource {
  manufacturer: string;
  sourceType: 'official_catalog' | 'official_product_table' | 'engineering_manual' | 'industry_standard';
  catalogCode?: string;
  reference: string;
  verifiedAt: string;
}

export interface BearingProduct {
  id: string;
  code: string;
  category: 'ball' | 'roller' | 'spherical' | 'cylindrical' | 'thrust' | 'housing' | 'seal' | 'lubricant';
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  d: number; // Inner diameter (mm)
  D: number; // Outer diameter (mm)
  B: number; // Width / Thickness (mm)
  weightKg: number;
  crKn: number; // Dynamic load rating
  corKn: number; // Static load rating
  speedGreaseRpm: number;
  speedOilRpm: number;
  thermalSpeedRatingRpm?: number;
  speedReferenceType?: 'limiting' | 'thermal' | 'both';
  cageMaterialFa: string;
  cageMaterialEn: string;
  sealingFa: string;
  sealingEn: string;
  clearanceOptions: string[];
  brands: string[];
  applicationsFa: string[];
  applicationsEn: string[];
  inStock: boolean;
  featured?: boolean;
  imageUrl?: string;
  schematicType: 'deep-groove' | 'tapered' | 'spherical' | 'cylindrical' | 'thrust' | 'pillow-block' | 'oil-seal';
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

export interface RfqItem {
  product: BearingProduct;
  quantity: number;
  notes?: string;
}
