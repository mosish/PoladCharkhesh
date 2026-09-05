import { Router, Request, Response } from 'express';
import { getDatabase, runTransaction } from '../db';
import { requireAuth, requireRole, logAudit } from '../middleware';
import { rowToProduct, validateProductCandidate, generateProductSlug } from './productRoutes';
import { bearingProducts as canonicalProducts } from '../../src/data/products';
import { COMPANY_INFO as canonicalCompanyInfo } from '../../src/data/company';
import { DEFAULT_PAGE_CONTENT } from './contentRoutes';
import { DEFAULT_SEO_CONFIG } from './seoRoutes';

export const systemRouter = Router();

/**
 * GET /api/system/audit-logs
 * Protected audit logs list
 */
systemRouter.get('/audit-logs', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const entity = req.query.entity ? String(req.query.entity) : null;
  const action = req.query.action ? String(req.query.action) : null;

  let sql = 'SELECT * FROM audit_logs';
  const conditions: string[] = [];
  const params: any[] = [];

  if (entity && entity !== 'ALL') {
    conditions.push('entity = ?');
    params.push(entity);
  }

  if (action && action !== 'ALL') {
    conditions.push('action = ?');
    params.push(action);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY timestamp DESC LIMIT ?;';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as any[];

  const logs = rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id || undefined,
    summary: r.summary,
    details: r.details ? JSON.parse(r.details) : undefined,
    performedBy: r.performed_by,
    ipAddress: r.ip_address || undefined,
  }));

  res.json({ logs });
});

/**
 * GET /api/system/backup
 * Secure admin export of database content.
 * CRITICAL SECURITY INVARIANT:
 * Passwords, hashes, salts, and active session tokens are EXCLUDED.
 */
systemRouter.get('/backup', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();

  const productRows = db.prepare('SELECT * FROM products ORDER BY created_at DESC;').all();
  const products = productRows.map(rowToProduct);

  const companyRow = db.prepare('SELECT data FROM company_info WHERE id = ?;').get('main') as any;
  const companyInfo = companyRow && companyRow.data ? JSON.parse(companyRow.data) : canonicalCompanyInfo;

  const contentRow = db.prepare('SELECT data FROM cms_content WHERE id = ?;').get('main') as any;
  const pageContent = contentRow && contentRow.data ? JSON.parse(contentRow.data) : DEFAULT_PAGE_CONTENT;

  const seoRow = db.prepare('SELECT data FROM seo_config WHERE id = ?;').get('main') as any;
  const seoConfig = seoRow && seoRow.data ? JSON.parse(seoRow.data) : DEFAULT_SEO_CONFIG;

  const auditCountRow = db.prepare('SELECT COUNT(*) as c FROM audit_logs;').get() as any;
  const inqCountRow = db.prepare('SELECT COUNT(*) as c FROM inquiries;').get() as any;

  const snapshot = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: req.admin!.username,
    products,
    companyInfo,
    pageContent,
    seoConfig,
    auditLogsCount: Number(auditCountRow.c),
    inquiriesCount: Number(inqCountRow.c),
  };

  logAudit('BACKUP_EXPORTED', 'system', `خروجی پشتیبان کامل سیستم (${products.length} کالا) تهیه شد.`, req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="poladcharkhesh-backup-${new Date().toISOString().split('T')[0]}.json"`
  );
  res.json(snapshot);
});

/**
 * POST /api/system/restore
 * Secure restore from JSON backup.
 * Creates an automatic snapshot before applying destructive changes.
 */
systemRouter.post('/restore', requireAuth, requireRole(['superadmin']), (req: Request, res: Response): void => {
  const backup = req.body;

  if (!backup || typeof backup !== 'object') {
    res.status(400).json({ error: 'ساختار فایل پشتیبان نامعتبر است.' });
    return;
  }

  if (!Array.isArray(backup.products) || backup.products.length === 0) {
    res.status(400).json({ error: 'لیست کالاهای فایل پشتیبان خالی یا نامعتبر است.' });
    return;
  }

  // Validate all products
  for (const p of backup.products) {
    const val = validateProductCandidate(p);
    if (!val.isValid) {
      res.status(400).json({
        error: `کالای ${p.code || 'نامشخص'} دارای اطلاعات ناقص است: ${val.errors.join(' - ')}`,
      });
      return;
    }
  }

  const db = getDatabase();

  // 1. Create automatic pre-restore backup snapshot in database
  const currentProducts = db.prepare('SELECT * FROM products;').all().map(rowToProduct);
  const preRestoreSnapshot = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'system-pre-restore',
    products: currentProducts,
  };

  db.prepare(`
    INSERT INTO backup_snapshots (id, created_at, created_by, reason, snapshot_data)
    VALUES (?, ?, ?, 'pre-restore-auto-snapshot', ?);
  `).run(
    `snap_${Date.now()}`,
    new Date().toISOString(),
    req.admin!.username,
    JSON.stringify(preRestoreSnapshot)
  );

  // 2. Perform restore inside atomic transaction
  try {
    runTransaction((database) => {
      // Clear existing products
      database.exec('DELETE FROM products;');

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

      const nowIso = new Date().toISOString();

      for (const p of backup.products) {
        const cleanCode = String(p.code).trim().toUpperCase();
        const slug = p.slug || generateProductSlug(cleanCode, p.category);
        const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        insertStmt.run(
          id,
          cleanCode,
          slug,
          p.category,
          String(p.nameFa).trim(),
          String(p.nameEn).trim(),
          p.descriptionFa || '',
          p.descriptionEn || '',
          p.inStock !== false ? 1 : 0,
          p.featured ? 1 : 0,
          p.isArchived ? 1 : 0,
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
          p.createdAt || nowIso,
          nowIso,
          req.admin!.username
        );
      }

      // Restore company info if included
      if (backup.companyInfo) {
        database.prepare(`
          INSERT INTO company_info (id, data, updated_at, updated_by)
          VALUES ('main', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
        `).run(JSON.stringify(backup.companyInfo), nowIso, req.admin!.username);
      }

      // Restore CMS content if included
      if (backup.pageContent) {
        database.prepare(`
          INSERT INTO cms_content (id, data, updated_at, updated_by)
          VALUES ('main', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
        `).run(JSON.stringify(backup.pageContent), nowIso, req.admin!.username);
      }

      // Restore SEO config if included
      if (backup.seoConfig) {
        database.prepare(`
          INSERT INTO seo_config (id, data, updated_at, updated_by)
          VALUES ('main', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
        `).run(JSON.stringify(backup.seoConfig), nowIso, req.admin!.username);
      }
    });

    logAudit(
      'BACKUP_IMPORTED',
      'system',
      `بازیابی پایگاه داده از پشتیبان با موفقیت انجام شد (${backup.products.length} کالا).`,
      req
    );

    res.json({
      success: true,
      message: `بازیابی موفقیت‌آمیز ${backup.products.length} کالا و تنظیمات انجام شد.`,
      productsCount: backup.products.length,
    });
  } catch (err: any) {
    console.error('Restore failed:', err);
    res.status(500).json({ error: 'خطای سیستمی در اعمال فایل پشتیبان.' });
  }
});

/**
 * POST /api/system/factory-reset
 * Reset products catalog to the 68 canonical engineering bearing products
 */
systemRouter.post('/factory-reset', requireAuth, requireRole(['superadmin']), (req: Request, res: Response): void => {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  // Save pre-reset snapshot
  const currentProducts = db.prepare('SELECT * FROM products;').all().map(rowToProduct);
  db.prepare(`
    INSERT INTO backup_snapshots (id, created_at, created_by, reason, snapshot_data)
    VALUES (?, ?, ?, 'pre-factory-reset-snapshot', ?);
  `).run(
    `snap_${Date.now()}`,
    nowIso,
    req.admin!.username,
    JSON.stringify({ products: currentProducts })
  );

  runTransaction((database) => {
    database.exec('DELETE FROM products;');

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
        req.admin!.username
      );
    }

    // Reset company, content, SEO
    database.prepare(`
      INSERT INTO company_info (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
    `).run(JSON.stringify(canonicalCompanyInfo), nowIso, req.admin!.username);

    database.prepare(`
      INSERT INTO cms_content (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
    `).run(JSON.stringify(DEFAULT_PAGE_CONTENT), nowIso, req.admin!.username);

    database.prepare(`
      INSERT INTO seo_config (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;
    `).run(JSON.stringify(DEFAULT_SEO_CONFIG), nowIso, req.admin!.username);
  });

  logAudit('SYSTEM_RESET', 'system', 'بازنشانی کاتالوگ به ۶۸ کالای استاندارد کارخانه انجام شد.', req);

  res.json({
    success: true,
    message: 'کاتالوگ و تنظیمات به ۶۸ کالای مهندسی پایه بازنشانی گردید.',
    productsCount: canonicalProducts.length,
  });
});
