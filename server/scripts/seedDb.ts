import { getDatabase, runTransaction } from '../db';
import { bearingProducts as canonicalProducts } from '../../src/data/products';
import { COMPANY_INFO as canonicalCompanyInfo } from '../../src/data/company';
import { DEFAULT_PAGE_CONTENT } from '../routes/contentRoutes';
import { DEFAULT_SEO_CONFIG } from '../routes/seoRoutes';
import { generateProductSlug } from '../routes/productRoutes';

export function seedDatabase(force: boolean = false): { productsSeeded: number; skipped: boolean } {
  const db = getDatabase();

  const countRow = db.prepare('SELECT COUNT(*) as count FROM products;').get() as { count: number | bigint };
  const existingCount = Number(countRow.count);

  if (existingCount > 0 && !force) {
    console.log(`[Database Seed] Database already contains ${existingCount} products. Skipping seed.`);
    return { productsSeeded: existingCount, skipped: true };
  }

  console.log(`[Database Seed] Seeding ${canonicalProducts.length} canonical bearings into SQLite...`);
  const nowIso = new Date().toISOString();

  runTransaction((database) => {
    if (force) {
      database.exec('DELETE FROM products;');
    }

    const insertStmt = database.prepare(`
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
        ?, ?, 0, ?, ?, ?, ?,
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

    for (const p of canonicalProducts) {
      const cleanCode = String(p.code).trim().toUpperCase();
      const slug = p.slug || generateProductSlug(cleanCode, p.category);

      insertStmt.run(
        p.id,
        cleanCode,
        slug,
        p.category,
        p.nameFa,
        p.nameEn,
        p.descriptionFa || '',
        p.descriptionEn || '',
        p.inStock !== false ? 1 : 0,
        p.featured ? 1 : 0,
        Number(p.d) || 0,
        Number(p.D) || 0,
        Number(p.B) || 0,
        p.weightKg !== undefined ? Number(p.weightKg) : null,
        Number(p.crKn) || 0,
        Number(p.corKn) || 0,
        Number(p.speedGreaseRpm) || 0,
        Number(p.speedOilRpm) || Number(p.speedGreaseRpm) || 0,
        p.thermalSpeedRatingRpm !== undefined ? Number(p.thermalSpeedRatingRpm) : null,
        p.cageMaterialFa || '',
        p.cageMaterialEn || '',
        p.sealingFa || '',
        p.sealingEn || '',
        JSON.stringify(p.clearanceOptions || ['Normal', 'C3']),
        p.schematicType || 'tapered',
        p.rMin !== undefined ? Number(p.rMin) : null,
        p.calculationFactorE !== undefined ? Number(p.calculationFactorE) : null,
        p.calculationFactorY !== undefined ? Number(p.calculationFactorY) : null,
        p.calculationFactorY0 !== undefined ? Number(p.calculationFactorY0) : null,
        p.calculationFactorY1 !== undefined ? Number(p.calculationFactorY1) : null,
        p.calculationFactorY2 !== undefined ? Number(p.calculationFactorY2) : null,
        p.calculationFactorF0 !== undefined ? Number(p.calculationFactorF0) : null,
        p.imageUrl || '/icon.png',
        JSON.stringify(p.images || [p.imageUrl || '/icon.png']),
        p.pdfUrl || null,
        JSON.stringify(p.brands || ['SKF', 'FAG', 'TIMKEN']),
        JSON.stringify(p.applicationsFa || ['صنایع عمومی']),
        JSON.stringify(p.applicationsEn || ['General Industry']),
        JSON.stringify(p.industryIds || ['steel', 'mining']),
        JSON.stringify(p.technicalSources || []),
        p.metaTitleFa || null,
        p.metaTitleEn || null,
        p.metaDescriptionFa || null,
        p.metaDescriptionEn || null,
        nowIso,
        nowIso,
        'system-seed'
      );
    }

    // Seed default company info if not set
    database.prepare(`
      INSERT OR IGNORE INTO company_info (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, 'system-seed');
    `).run(JSON.stringify(canonicalCompanyInfo), nowIso);

    // Seed default CMS content if not set
    database.prepare(`
      INSERT OR IGNORE INTO cms_content (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, 'system-seed');
    `).run(JSON.stringify(DEFAULT_PAGE_CONTENT), nowIso);

    // Seed default SEO config if not set
    database.prepare(`
      INSERT OR IGNORE INTO seo_config (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, 'system-seed');
    `).run(JSON.stringify(DEFAULT_SEO_CONFIG), nowIso);
  });

  console.log(`[Database Seed] Successfully seeded ${canonicalProducts.length} bearings and default CMS metadata.`);
  return { productsSeeded: canonicalProducts.length, skipped: false };
}

// If run directly via CLI
if (process.argv[1]?.endsWith('seedDb.ts') || process.argv[1]?.endsWith('seedDb.js')) {
  seedDatabase();
}
