import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, logAudit } from '../middleware';
import { verifySession } from '../auth';
import { CONFIG } from '../config';

export const productRouter = Router();

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function rowToProduct(r: any): any {
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
    weightKg: r.weight_kg !== null ? Number(r.weight_kg) : undefined,
    crKn: Number(r.cr_kn),
    corKn: Number(r.cor_kn),
    speedGreaseRpm: Number(r.speed_grease_rpm),
    speedOilRpm: Number(r.speed_oil_rpm),
    thermalSpeedRatingRpm: r.thermal_speed_rating_rpm !== null ? Number(r.thermal_speed_rating_rpm) : undefined,
    cageMaterialFa: r.cage_material_fa || '',
    cageMaterialEn: r.cage_material_en || '',
    sealingFa: r.sealing_fa || '',
    sealingEn: r.sealing_en || '',
    clearanceOptions: safeJsonParse<string[]>(r.clearance_options, ['Normal', 'C3']),
    schematicType: r.schematic_type || 'tapered',
    rMin: r.r_min !== null ? Number(r.r_min) : undefined,
    calculationFactorE: r.calculation_factor_e !== null ? Number(r.calculation_factor_e) : undefined,
    calculationFactorY: r.calculation_factor_y !== null ? Number(r.calculation_factor_y) : undefined,
    calculationFactorY0: r.calculation_factor_y0 !== null ? Number(r.calculation_factor_y0) : undefined,
    calculationFactorY1: r.calculation_factor_y1 !== null ? Number(r.calculation_factor_y1) : undefined,
    calculationFactorY2: r.calculation_factor_y2 !== null ? Number(r.calculation_factor_y2) : undefined,
    calculationFactorF0: r.calculation_factor_f0 !== null ? Number(r.calculation_factor_f0) : undefined,
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

export function generateProductSlug(code: string, category: string): string {
  const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  return `${cleanCode}-${category}`;
}

export function validateProductCandidate(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.code || !String(body.code).trim()) {
    errors.push('شماره فنی قطعه (Technical Code) الزامی است.');
  }
  if (!body.nameFa || !String(body.nameFa).trim()) {
    errors.push('نام فارسی کالا الزامی است.');
  }
  if (!body.nameEn || !String(body.nameEn).trim()) {
    errors.push('نام انگلیسی کالا الزامی است.');
  }
  if (!body.category) {
    errors.push('دسته‌بندی کالا الزامی است.');
  }

  if (body.category !== 'seal' && body.category !== 'lubricant') {
    const d = Number(body.d);
    const D = Number(body.D);
    const B = Number(body.B);
    const cr = Number(body.crKn);
    const cor = Number(body.corKn);
    const speedGrease = Number(body.speedGreaseRpm);

    if (isNaN(d) || d <= 0) errors.push('قطر داخلی (d) باید عددی بزرگتر از صفر باشد.');
    if (isNaN(D) || D <= 0) errors.push('قطر خارجی (D) باید عددی بزرگتر از صفر باشد.');
    if (!isNaN(d) && !isNaN(D) && D <= d) errors.push('قطر خارجی (D) باید اکیداً بزرگتر از قطر داخلی (d) باشد.');
    if (isNaN(B) || B <= 0) errors.push('عرض/ضخامت (B) باید عددی بزرگتر از صفر باشد.');
    if (isNaN(cr) || cr <= 0) errors.push('بار دینامیکی پایه (Cr) باید عددی بزرگتر از صفر باشد.');
    if (isNaN(cor) || cor <= 0) errors.push('بار استاتیکی پایه (C0r) باید عددی بزرگتر از صفر باشد.');
    if (isNaN(speedGrease) || speedGrease <= 0) errors.push('سرعت مجاز با گریس (RPM) باید مشخص و معتبر باشد.');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * GET /api/products
 * Public list of products. If includeArchived=true is requested, requires active admin session.
 */
productRouter.get('/', (req: Request, res: Response) => {
  const includeArchivedReq = req.query.includeArchived === 'true';
  let allowArchived = false;

  if (includeArchivedReq) {
    // Verify session
    let token = req.cookies?.[CONFIG.COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token && verifySession(token).valid) {
      allowArchived = true;
    }
  }

  const db = getDatabase();
  let sql = 'SELECT * FROM products';
  const params: any[] = [];

  if (!allowArchived) {
    sql += ' WHERE is_archived = 0';
  }

  sql += ' ORDER BY created_at DESC;';

  const rows = db.prepare(sql).all(...params);
  const products = rows.map(rowToProduct);

  res.json({
    count: products.length,
    products,
  });
});

/**
 * GET /api/products/:idOrSlug
 */
productRouter.get('/:idOrSlug', (req: Request, res: Response): void => {
  const idOrSlug = String(req.params.idOrSlug).trim();
  const db = getDatabase();

  const row = db.prepare(`
    SELECT * FROM products 
    WHERE id = ? OR slug = ? OR LOWER(code) = LOWER(?)
    LIMIT 1;
  `).get(idOrSlug, idOrSlug, idOrSlug);

  if (!row) {
    res.status(404).json({ error: 'کالای مورد نظر یافت نشد.' });
    return;
  }

  res.json({ product: rowToProduct(row) });
});

/**
 * POST /api/products
 * Protected product creation
 */
productRouter.post('/', requireAuth, (req: Request, res: Response): void => {
  const candidate = req.body || {};
  const validation = validateProductCandidate(candidate);

  if (!validation.isValid) {
    res.status(400).json({ success: false, errors: validation.errors });
    return;
  }

  const db = getDatabase();
  const cleanCode = String(candidate.code).trim().toUpperCase();

  // Check duplicate code
  const existing = db.prepare('SELECT id FROM products WHERE UPPER(code) = ?;').get(cleanCode);
  if (existing) {
    res.status(409).json({ success: false, errors: [`کد فنی ${cleanCode} قبلاً در کاتالوگ ثبت شده است.`] });
    return;
  }

  const id = candidate.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = candidate.slug || generateProductSlug(cleanCode, candidate.category);
  const nowIso = new Date().toISOString();

  db.prepare(`
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
  `).run(
    id,
    cleanCode,
    slug,
    candidate.category,
    String(candidate.nameFa).trim(),
    String(candidate.nameEn).trim(),
    candidate.descriptionFa || '',
    candidate.descriptionEn || '',
    candidate.inStock !== false ? 1 : 0,
    candidate.featured ? 1 : 0,
    Number(candidate.d) || 0,
    Number(candidate.D) || 0,
    Number(candidate.B) || 0,
    candidate.weightKg !== undefined ? Number(candidate.weightKg) : null,
    Number(candidate.crKn) || 0,
    Number(candidate.corKn) || 0,
    Number(candidate.speedGreaseRpm) || 0,
    Number(candidate.speedOilRpm) || Number(candidate.speedGreaseRpm) || 0,
    candidate.thermalSpeedRatingRpm !== undefined ? Number(candidate.thermalSpeedRatingRpm) : null,
    candidate.cageMaterialFa || 'فولاد آلیاژی',
    candidate.cageMaterialEn || 'Standard Alloy Steel',
    candidate.sealingFa || 'Open (طراحی باز)',
    candidate.sealingEn || 'Open Design',
    JSON.stringify(candidate.clearanceOptions || ['Normal', 'C3']),
    candidate.schematicType || 'tapered',
    candidate.rMin !== undefined ? Number(candidate.rMin) : null,
    candidate.calculationFactorE !== undefined ? Number(candidate.calculationFactorE) : null,
    candidate.calculationFactorY !== undefined ? Number(candidate.calculationFactorY) : null,
    candidate.calculationFactorY0 !== undefined ? Number(candidate.calculationFactorY0) : null,
    candidate.calculationFactorY1 !== undefined ? Number(candidate.calculationFactorY1) : null,
    candidate.calculationFactorY2 !== undefined ? Number(candidate.calculationFactorY2) : null,
    candidate.calculationFactorF0 !== undefined ? Number(candidate.calculationFactorF0) : null,
    candidate.imageUrl || '/icon.png',
    JSON.stringify(candidate.images || [candidate.imageUrl || '/icon.png']),
    candidate.pdfUrl || null,
    JSON.stringify(candidate.brands || ['SKF', 'FAG', 'TIMKEN']),
    JSON.stringify(candidate.applicationsFa || ['صنایع عمومی']),
    JSON.stringify(candidate.applicationsEn || ['General Industry']),
    JSON.stringify(candidate.industryIds || ['steel', 'mining']),
    JSON.stringify(candidate.technicalSources || []),
    candidate.metaTitleFa || null,
    candidate.metaTitleEn || null,
    candidate.metaDescriptionFa || null,
    candidate.metaDescriptionEn || null,
    nowIso,
    nowIso,
    req.admin!.username
  );

  const createdRow = db.prepare('SELECT * FROM products WHERE id = ?;').get(id);
  const fullProduct = rowToProduct(createdRow);

  logAudit('PRODUCT_CREATED', 'product', `کالای جدید ${fullProduct.code} ایجاد شد.`, req, id, {
    code: fullProduct.code,
    category: fullProduct.category,
  });

  res.status(201).json({ success: true, product: fullProduct });
});

/**
 * PUT /api/products/:id
 * Protected product update
 */
productRouter.put('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const updates = req.body || {};
  const db = getDatabase();

  const existingRow = db.prepare('SELECT * FROM products WHERE id = ?;').get(id);
  if (!existingRow) {
    res.status(404).json({ success: false, errors: ['کالای مورد نظر یافت نشد.'] });
    return;
  }

  const current = rowToProduct(existingRow);
  const merged = { ...current, ...updates };
  const validation = validateProductCandidate(merged);

  if (!validation.isValid) {
    res.status(400).json({ success: false, errors: validation.errors });
    return;
  }

  // Check code uniqueness if code changed
  const newCode = String(merged.code).trim().toUpperCase();
  if (newCode !== current.code) {
    const dup = db.prepare('SELECT id FROM products WHERE UPPER(code) = ? AND id != ?;').get(newCode, id);
    if (dup) {
      res.status(409).json({ success: false, errors: [`کد فنی ${newCode} تکراری است.`] });
      return;
    }
  }

  const nowIso = new Date().toISOString();
  const slug = merged.slug || generateProductSlug(newCode, merged.category);

  db.prepare(`
    UPDATE products SET
      code = ?, slug = ?, category = ?, name_fa = ?, name_en = ?,
      description_fa = ?, description_en = ?, in_stock = ?, featured = ?,
      d_inner = ?, d_outer = ?, b_width = ?, weight_kg = ?,
      cr_kn = ?, cor_kn = ?, speed_grease_rpm = ?, speed_oil_rpm = ?, thermal_speed_rating_rpm = ?,
      cage_material_fa = ?, cage_material_en = ?, sealing_fa = ?, sealing_en = ?,
      clearance_options = ?, schematic_type = ?, r_min = ?,
      calculation_factor_e = ?, calculation_factor_y = ?, calculation_factor_y0 = ?,
      calculation_factor_y1 = ?, calculation_factor_y2 = ?, calculation_factor_f0 = ?,
      image_url = ?, images = ?, pdf_url = ?, brands = ?,
      applications_fa = ?, applications_en = ?, industry_ids = ?, technical_sources = ?,
      meta_title_fa = ?, meta_title_en = ?, meta_description_fa = ?, meta_description_en = ?,
      updated_at = ?, updated_by = ?
    WHERE id = ?;
  `).run(
    newCode,
    slug,
    merged.category,
    String(merged.nameFa).trim(),
    String(merged.nameEn).trim(),
    merged.descriptionFa || '',
    merged.descriptionEn || '',
    merged.inStock ? 1 : 0,
    merged.featured ? 1 : 0,
    Number(merged.d) || 0,
    Number(merged.D) || 0,
    Number(merged.B) || 0,
    merged.weightKg !== undefined ? Number(merged.weightKg) : null,
    Number(merged.crKn) || 0,
    Number(merged.corKn) || 0,
    Number(merged.speedGreaseRpm) || 0,
    Number(merged.speedOilRpm) || Number(merged.speedGreaseRpm) || 0,
    merged.thermalSpeedRatingRpm !== undefined ? Number(merged.thermalSpeedRatingRpm) : null,
    merged.cageMaterialFa || '',
    merged.cageMaterialEn || '',
    merged.sealingFa || '',
    merged.sealingEn || '',
    JSON.stringify(merged.clearanceOptions || []),
    merged.schematicType || 'tapered',
    merged.rMin !== undefined ? Number(merged.rMin) : null,
    merged.calculationFactorE !== undefined ? Number(merged.calculationFactorE) : null,
    merged.calculationFactorY !== undefined ? Number(merged.calculationFactorY) : null,
    merged.calculationFactorY0 !== undefined ? Number(merged.calculationFactorY0) : null,
    merged.calculationFactorY1 !== undefined ? Number(merged.calculationFactorY1) : null,
    merged.calculationFactorY2 !== undefined ? Number(merged.calculationFactorY2) : null,
    merged.calculationFactorF0 !== undefined ? Number(merged.calculationFactorF0) : null,
    merged.imageUrl || '/icon.png',
    JSON.stringify(merged.images || []),
    merged.pdfUrl || null,
    JSON.stringify(merged.brands || []),
    JSON.stringify(merged.applicationsFa || []),
    JSON.stringify(merged.applicationsEn || []),
    JSON.stringify(merged.industryIds || []),
    JSON.stringify(merged.technicalSources || []),
    merged.metaTitleFa || null,
    merged.metaTitleEn || null,
    merged.metaDescriptionFa || null,
    merged.metaDescriptionEn || null,
    nowIso,
    req.admin!.username,
    id
  );

  const updatedRow = db.prepare('SELECT * FROM products WHERE id = ?;').get(id);
  const updatedProduct = rowToProduct(updatedRow);

  logAudit('PRODUCT_UPDATED', 'product', `مشخصات قطعه ${updatedProduct.code} به‌روزرسانی شد.`, req, id, {
    code: updatedProduct.code,
  });

  res.json({ success: true, product: updatedProduct });
});

/**
 * PATCH /api/products/:id/archive
 * Toggle archive/active status
 */
productRouter.patch('/:id/archive', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const db = getDatabase();

  const product = db.prepare('SELECT id, code, is_archived FROM products WHERE id = ?;').get(id) as any;
  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  const newArchived = product.is_archived === 1 ? 0 : 1;
  const nowIso = new Date().toISOString();

  db.prepare('UPDATE products SET is_archived = ?, updated_at = ?, updated_by = ? WHERE id = ?;').run(
    newArchived,
    nowIso,
    req.admin!.username,
    id
  );

  const actionName = newArchived ? 'PRODUCT_ARCHIVED' : 'PRODUCT_RESTORED';
  logAudit(actionName, 'product', `${newArchived ? 'بایگانی' : 'بازیابی'} قطعه ${product.code}`, req, id);

  res.json({ success: true, isArchived: newArchived === 1 });
});

/**
 * DELETE /api/products/:id
 * Delete product permanently
 */
productRouter.delete('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const db = getDatabase();

  const product = db.prepare('SELECT id, code FROM products WHERE id = ?;').get(id) as any;
  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  db.prepare('DELETE FROM products WHERE id = ?;').run(id);

  logAudit('PRODUCT_DELETED', 'product', `حذف دائم قطعه ${product.code} از سیستم`, req, id);

  res.json({ success: true, message: `قطعه ${product.code} با موفقیت حذف گردید.` });
});
