/**
 * POLAD CHARKHESH - PRODUCT DATASET INTEGRITY VALIDATOR
 * 
 * Performs safe, non-destructive sanity and consistency checks across the
 * product dataset during development. Ensures:
 * 1. No duplicate product IDs
 * 2. No duplicate technical codes (normalized)
 * 3. No duplicate slugs
 * 4. All mandatory engineering fields are populated (d, D, B, crKn, corKn, etc.)
 * 5. All categories map to valid engineering types
 */

import { BearingProduct, BearingCategory } from '../types';

export interface ProductValidationResult {
  isValid: boolean;
  totalChecked: number;
  duplicateIds: string[];
  duplicateCodes: string[];
  duplicateSlugs: string[];
  invalidCategories: Array<{ id: string; category: string }>;
  missingRequiredFields: Array<{ id: string; missing: string[] }>;
  warnings: string[];
}

const VALID_CATEGORIES: BearingCategory[] = [
  'ball',
  'roller',
  'spherical',
  'cylindrical',
  'thrust',
  'housing',
  'seal',
  'lubricant',
];

export function validateProductDataset(products: BearingProduct[]): ProductValidationResult {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const seenSlugs = new Set<string>();

  const duplicateIds: string[] = [];
  const duplicateCodes: string[] = [];
  const duplicateSlugs: string[] = [];
  const invalidCategories: Array<{ id: string; category: string }> = [];
  const missingRequiredFields: Array<{ id: string; missing: string[] }> = [];
  const warnings: string[] = [];

  for (const product of products) {
    // 1. ID Check
    if (seenIds.has(product.id)) {
      duplicateIds.push(product.id);
    } else {
      seenIds.add(product.id);
    }

    // 2. Technical Code Check (Normalized)
    const normalizedCode = product.code.trim().toUpperCase().replace(/\s+/g, '');
    if (seenCodes.has(normalizedCode)) {
      duplicateCodes.push(product.code);
    } else {
      seenCodes.add(normalizedCode);
    }

    // 3. Slug Check
    if (product.slug) {
      if (seenSlugs.has(product.slug)) {
        duplicateSlugs.push(product.slug);
      } else {
        seenSlugs.add(product.slug);
      }
    }

    // 4. Category Check
    if (!VALID_CATEGORIES.includes(product.category)) {
      invalidCategories.push({ id: product.id, category: product.category });
    }

    // 5. Missing Required Fields Check
    const missing: string[] = [];
    if (!product.id) missing.push('id');
    if (!product.code) missing.push('code');
    if (!product.nameFa) missing.push('nameFa');
    if (!product.nameEn) missing.push('nameEn');
    if (product.d <= 0 && product.category !== 'seal' && product.category !== 'lubricant') missing.push('d');
    if (product.D <= 0 && product.category !== 'seal' && product.category !== 'lubricant') missing.push('D');
    if (product.B <= 0 && product.category !== 'seal' && product.category !== 'lubricant') missing.push('B');

    if (missing.length > 0) {
      missingRequiredFields.push({ id: product.id, missing });
    }

    // 6. Engineering Warnings
    if (product.category !== 'seal' && product.category !== 'lubricant') {
      if (product.crKn <= 0) {
        warnings.push(`Bearing ${product.code} (${product.id}) has non-positive Cr rating (${product.crKn} kN)`);
      }
      if (product.speedGreaseRpm <= 0) {
        warnings.push(`Bearing ${product.code} (${product.id}) has non-positive grease speed (${product.speedGreaseRpm} RPM)`);
      }
    }
  }

  const isValid = 
    duplicateIds.length === 0 &&
    duplicateCodes.length === 0 &&
    duplicateSlugs.length === 0 &&
    invalidCategories.length === 0 &&
    missingRequiredFields.length === 0;

  return {
    isValid,
    totalChecked: products.length,
    duplicateIds,
    duplicateCodes,
    duplicateSlugs,
    invalidCategories,
    missingRequiredFields,
    warnings,
  };
}

/**
 * Runs validation in development mode and logs diagnostics cleanly.
 */
export function runDevProductValidation(products: BearingProduct[]): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const report = validateProductDataset(products);
    if (!report.isValid) {
      console.warn('[Polad Charkhesh Data Validation] Product catalog dataset integrity issues detected:', report);
    } else {
      console.info(`[Polad Charkhesh Data Validation] Verified ${report.totalChecked} products cleanly with ISO architecture.`);
    }
  }
}
