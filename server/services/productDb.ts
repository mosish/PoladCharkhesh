/**
 * POLAD CHARKHESH - PRODUCT DATABASE ACCESS SERVICE
 * 
 * Encapsulates SQLite data operations for engineering bearing products.
 */

import { getDatabase } from '../db';
import { BearingProduct } from '../../src/types';

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function rowToProduct(r: any): BearingProduct {
  return {
    id: r.id,
    code: r.code,
    slug: r.slug,
    category: r.category,
    nameFa: r.name_fa,
    nameEn: r.name_en,
    descriptionFa: r.description_fa || '',
    descriptionEn: r.description_en || '',
    inStock: Boolean(r.in_stock),
    featured: Boolean(r.featured),
    isArchived: Boolean(r.is_archived),
    d: Number(r.d_inner),
    D: Number(r.d_outer),
    B: Number(r.b_width),
    weightKg: Number(r.weight_kg) || 0,
    crKn: Number(r.cr_kn),
    corKn: Number(r.cor_kn),
    speedGreaseRpm: Number(r.speed_grease_rpm),
    speedOilRpm: Number(r.speed_oil_rpm),
    thermalSpeedRatingRpm: r.thermal_speed_rating_rpm !== null && r.thermal_speed_rating_rpm !== undefined ? Number(r.thermal_speed_rating_rpm) : undefined,
    cageMaterialFa: r.cage_material_fa || '',
    cageMaterialEn: r.cage_material_en || '',
    sealingFa: r.sealing_fa || '',
    sealingEn: r.sealing_en || '',
    clearanceOptions: safeJsonParse<string[]>(r.clearance_options, ['Normal', 'C3']),
    schematicType: r.schematic_type || 'tapered',
    rMin: r.r_min !== null && r.r_min !== undefined ? Number(r.r_min) : undefined,
    calculationFactorE: r.calculation_factor_e !== null && r.calculation_factor_e !== undefined ? Number(r.calculation_factor_e) : undefined,
    calculationFactorY: r.calculation_factor_y !== null && r.calculation_factor_y !== undefined ? Number(r.calculation_factor_y) : undefined,
    calculationFactorY0: r.calculation_factor_y0 !== null && r.calculation_factor_y0 !== undefined ? Number(r.calculation_factor_y0) : undefined,
    calculationFactorY1: r.calculation_factor_y1 !== null && r.calculation_factor_y1 !== undefined ? Number(r.calculation_factor_y1) : undefined,
    calculationFactorY2: r.calculation_factor_y2 !== null && r.calculation_factor_y2 !== undefined ? Number(r.calculation_factor_y2) : undefined,
    calculationFactorF0: r.calculation_factor_f0 !== null && r.calculation_factor_f0 !== undefined ? Number(r.calculation_factor_f0) : undefined,
    imageUrl: r.image_url || '/icon.png',
    images: safeJsonParse<string[]>(r.images, [r.image_url || '/icon.png']),
    pdfUrl: r.pdf_url || undefined,
    brands: safeJsonParse<string[]>(r.brands, ['SKF', 'FAG', 'TIMKEN']),
    applicationsFa: safeJsonParse<string[]>(r.applications_fa, ['صنایع عمومی']),
    applicationsEn: safeJsonParse<string[]>(r.applications_en, ['General Industry']),
    industryIds: safeJsonParse<string[]>(r.industry_ids, ['steel', 'mining']),
    technicalSources: safeJsonParse<any[]>(r.technical_sources, []),
    metaTitleFa: r.meta_title_fa || undefined,
    metaTitleEn: r.meta_title_en || undefined,
    metaDescriptionFa: r.meta_description_fa || undefined,
    metaDescriptionEn: r.meta_description_en || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by || undefined,
  };
}

export function generateProductSlug(code: string, category = 'bearing'): string {
  const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  return `${cleanCode}-${category}`;
}

export const productDb = {
  getAllProducts(includeArchived = false): BearingProduct[] {
    const db = getDatabase();
    const sql = includeArchived
      ? 'SELECT * FROM products ORDER BY created_at DESC;'
      : 'SELECT * FROM products WHERE is_archived = 0 ORDER BY created_at DESC;';
    const rows = db.prepare(sql).all() as any[];
    return rows.map(rowToProduct);
  },

  getProductByIdOrSlug(identifier: string): BearingProduct | null {
    const db = getDatabase();
    const row = db.prepare(
      'SELECT * FROM products WHERE id = ? OR slug = ? OR LOWER(code) = LOWER(?) LIMIT 1;'
    ).get(identifier, identifier, identifier) as any;
    return row ? rowToProduct(row) : null;
  },

  createProduct(productData: any, username: string): BearingProduct {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    const cleanCode = String(productData.code).trim().toUpperCase();
    const id = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = productData.slug || generateProductSlug(cleanCode, productData.category);

    const stmt = db.prepare(`
      INSERT INTO products (
        id, code, slug, category, name_fa, name_en, description_fa, description_en,
        in_stock, featured, is_archived, d_inner, d_outer, b_width, weight_kg,
        cr_kn, cor_kn, speed_grease_rpm, speed_oil_rpm, thermal_speed_rating_rpm,
        cage_material_fa, cage_material_en, sealing_fa, sealing_en,
        clearance_options, schematic_type, r_min,
        calculation_factor_e, calculation_factor_y, calculation_factor_y0,
        calculation_factor_y1, calculation_factor_y2, calculation_factor_f0,
        image_url, images, pdf_url, brands, applications_fa, applications_en,
        industry_ids, technical_sources, meta_title_fa, meta_title_en,
        meta_description_fa, meta_description_en, created_at, updated_at, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      );
    `);

    stmt.run(
      id,
      cleanCode,
      slug,
      productData.category,
      String(productData.nameFa).trim(),
      String(productData.nameEn).trim(),
      productData.descriptionFa ? String(productData.descriptionFa).trim() : '',
      productData.descriptionEn ? String(productData.descriptionEn).trim() : '',
      productData.inStock !== false ? 1 : 0,
      productData.featured ? 1 : 0,
      productData.isArchived ? 1 : 0,
      Number(productData.d || 0),
      Number(productData.D || 0),
      Number(productData.B || 0),
      productData.weightKg !== undefined && productData.weightKg !== null ? Number(productData.weightKg) : null,
      Number(productData.crKn || 0),
      Number(productData.corKn || 0),
      Number(productData.speedGreaseRpm || 0),
      Number(productData.speedOilRpm || productData.speedGreaseRpm || 0),
      productData.thermalSpeedRatingRpm !== undefined && productData.thermalSpeedRatingRpm !== null ? Number(productData.thermalSpeedRatingRpm) : null,
      productData.cageMaterialFa || '',
      productData.cageMaterialEn || '',
      productData.sealingFa || '',
      productData.sealingEn || '',
      JSON.stringify(productData.clearanceOptions || ['Normal', 'C3']),
      productData.schematicType || 'tapered',
      productData.rMin !== undefined && productData.rMin !== null ? Number(productData.rMin) : null,
      productData.calculationFactorE !== undefined && productData.calculationFactorE !== null ? Number(productData.calculationFactorE) : null,
      productData.calculationFactorY !== undefined && productData.calculationFactorY !== null ? Number(productData.calculationFactorY) : null,
      productData.calculationFactorY0 !== undefined && productData.calculationFactorY0 !== null ? Number(productData.calculationFactorY0) : null,
      productData.calculationFactorY1 !== undefined && productData.calculationFactorY1 !== null ? Number(productData.calculationFactorY1) : null,
      productData.calculationFactorY2 !== undefined && productData.calculationFactorY2 !== null ? Number(productData.calculationFactorY2) : null,
      productData.calculationFactorF0 !== undefined && productData.calculationFactorF0 !== null ? Number(productData.calculationFactorF0) : null,
      productData.imageUrl || '/icon.png',
      JSON.stringify(productData.images || [productData.imageUrl || '/icon.png']),
      productData.pdfUrl || null,
      JSON.stringify(productData.brands || ['SKF', 'FAG', 'TIMKEN']),
      JSON.stringify(productData.applicationsFa || ['صنایع عمومی']),
      JSON.stringify(productData.applicationsEn || ['General Industry']),
      JSON.stringify(productData.industryIds || ['steel', 'mining']),
      JSON.stringify(productData.technicalSources || []),
      productData.metaTitleFa || null,
      productData.metaTitleEn || null,
      productData.metaDescriptionFa || null,
      productData.metaDescriptionEn || null,
      nowIso,
      nowIso,
      username
    );

    return this.getProductByIdOrSlug(id)!;
  },

  updateProduct(id: string, updates: any, username: string): BearingProduct | null {
    const existing = this.getProductByIdOrSlug(id);
    if (!existing) return null;

    const db = getDatabase();
    const nowIso = new Date().toISOString();
    const merged = { ...existing, ...updates };

    db.prepare(`
      UPDATE products SET
        code = ?, category = ?, name_fa = ?, name_en = ?,
        description_fa = ?, description_en = ?, in_stock = ?, featured = ?,
        d_inner = ?, d_outer = ?, b_width = ?, weight_kg = ?,
        cr_kn = ?, cor_kn = ?, speed_grease_rpm = ?, speed_oil_rpm = ?,
        thermal_speed_rating_rpm = ?, cage_material_fa = ?, cage_material_en = ?,
        sealing_fa = ?, sealing_en = ?, clearance_options = ?, schematic_type = ?,
        r_min = ?, calculation_factor_e = ?, calculation_factor_y = ?,
        calculation_factor_y0 = ?, calculation_factor_y1 = ?, calculation_factor_y2 = ?,
        calculation_factor_f0 = ?, image_url = ?, images = ?, pdf_url = ?,
        brands = ?, applications_fa = ?, applications_en = ?, industry_ids = ?,
        technical_sources = ?, meta_title_fa = ?, meta_title_en = ?,
        meta_description_fa = ?, meta_description_en = ?,
        updated_at = ?, updated_by = ?
      WHERE id = ?;
    `).run(
      merged.code,
      merged.category,
      merged.nameFa,
      merged.nameEn,
      merged.descriptionFa || '',
      merged.descriptionEn || '',
      merged.inStock ? 1 : 0,
      merged.featured ? 1 : 0,
      Number(merged.d),
      Number(merged.D),
      Number(merged.B),
      merged.weightKg !== undefined && merged.weightKg !== null ? Number(merged.weightKg) : null,
      Number(merged.crKn),
      Number(merged.corKn),
      Number(merged.speedGreaseRpm),
      Number(merged.speedOilRpm || merged.speedGreaseRpm),
      merged.thermalSpeedRatingRpm !== undefined && merged.thermalSpeedRatingRpm !== null ? Number(merged.thermalSpeedRatingRpm) : null,
      merged.cageMaterialFa || '',
      merged.cageMaterialEn || '',
      merged.sealingFa || '',
      merged.sealingEn || '',
      JSON.stringify(merged.clearanceOptions || ['Normal', 'C3']),
      merged.schematicType || 'tapered',
      merged.rMin !== undefined && merged.rMin !== null ? Number(merged.rMin) : null,
      merged.calculationFactorE !== undefined && merged.calculationFactorE !== null ? Number(merged.calculationFactorE) : null,
      merged.calculationFactorY !== undefined && merged.calculationFactorY !== null ? Number(merged.calculationFactorY) : null,
      merged.calculationFactorY0 !== undefined && merged.calculationFactorY0 !== null ? Number(merged.calculationFactorY0) : null,
      merged.calculationFactorY1 !== undefined && merged.calculationFactorY1 !== null ? Number(merged.calculationFactorY1) : null,
      merged.calculationFactorY2 !== undefined && merged.calculationFactorY2 !== null ? Number(merged.calculationFactorY2) : null,
      merged.calculationFactorF0 !== undefined && merged.calculationFactorF0 !== null ? Number(merged.calculationFactorF0) : null,
      merged.imageUrl || '/icon.png',
      JSON.stringify(merged.images || [merged.imageUrl || '/icon.png']),
      merged.pdfUrl || null,
      JSON.stringify(merged.brands || ['SKF', 'FAG', 'TIMKEN']),
      JSON.stringify(merged.applicationsFa || ['صنایع عمومی']),
      JSON.stringify(merged.applicationsEn || ['General Industry']),
      JSON.stringify(merged.industryIds || ['steel', 'mining']),
      JSON.stringify(merged.technicalSources || []),
      merged.metaTitleFa || null,
      merged.metaTitleEn || null,
      merged.metaDescriptionFa || null,
      merged.metaDescriptionEn || null,
      nowIso,
      username,
      id
    );

    return this.getProductByIdOrSlug(id);
  },

  setProductArchive(id: string, isArchived: boolean, username: string): boolean {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    const res = db.prepare(
      'UPDATE products SET is_archived = ?, updated_at = ?, updated_by = ? WHERE id = ?;'
    ).run(isArchived ? 1 : 0, nowIso, username, id);
    return res.changes > 0;
  },

  deleteProduct(id: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM products WHERE id = ?;').run(id);
    return res.changes > 0;
  },
};
