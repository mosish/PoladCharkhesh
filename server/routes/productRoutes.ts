import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, logAudit } from '../middleware';
import { verifySession } from '../auth';
import { CONFIG } from '../config';
import { productDb, rowToProduct, generateProductSlug } from '../services/productDb';
import { validateProductCandidate } from '../validation';

export const productRouter = Router();

// Re-export helpers for backward-compatibility with tests/scripts
export { rowToProduct, generateProductSlug, validateProductCandidate };

/**
 * GET /api/products
 * Public list of products. If includeArchived=true is requested, requires active admin session.
 */
productRouter.get('/', (req: Request, res: Response) => {
  const includeArchivedReq = req.query.includeArchived === 'true';
  let allowArchived = false;

  if (includeArchivedReq) {
    const token = req.cookies?.[CONFIG.COOKIE_NAME];
    if (token && verifySession(token).valid) {
      allowArchived = true;
    }
  }

  const products = productDb.getAllProducts(allowArchived);

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
  const product = productDb.getProductByIdOrSlug(idOrSlug);

  if (!product) {
    res.status(404).json({ error: 'کالای مورد نظر یافت نشد.' });
    return;
  }

  res.json({ product });
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

  const cleanCode = String(candidate.code).trim().toUpperCase();
  const db = getDatabase();

  // Check duplicate code
  const existing = db.prepare('SELECT id FROM products WHERE UPPER(code) = ?;').get(cleanCode);
  if (existing) {
    res.status(409).json({ success: false, errors: [`کد فنی ${cleanCode} قبلاً در کاتالوگ ثبت شده است.`] });
    return;
  }

  const created = productDb.createProduct(candidate, req.admin!.username);

  logAudit('PRODUCT_CREATED', 'product', `کالای جدید ${created.code} ایجاد شد.`, req, created.id, {
    code: created.code,
    category: created.category,
  });

  res.status(201).json({ success: true, product: created });
});

/**
 * PUT /api/products/:id
 * Protected product update
 */
productRouter.put('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const updates = req.body || {};
  const current = productDb.getProductByIdOrSlug(id);

  if (!current) {
    res.status(404).json({ success: false, errors: ['کالای مورد نظر یافت نشد.'] });
    return;
  }

  const merged = { ...current, ...updates };
  const validation = validateProductCandidate(merged);

  if (!validation.isValid) {
    res.status(400).json({ success: false, errors: validation.errors });
    return;
  }

  const newCode = String(merged.code).trim().toUpperCase();
  if (newCode !== current.code) {
    const db = getDatabase();
    const dup = db.prepare('SELECT id FROM products WHERE UPPER(code) = ? AND id != ?;').get(newCode, id);
    if (dup) {
      res.status(409).json({ success: false, errors: [`کد فنی ${newCode} تکراری است.`] });
      return;
    }
  }

  const updated = productDb.updateProduct(id, merged, req.admin!.username);

  logAudit('PRODUCT_UPDATED', 'product', `مشخصات قطعه ${updated!.code} به‌روزرسانی شد.`, req, id, {
    code: updated!.code,
  });

  res.json({ success: true, product: updated });
});

/**
 * PATCH /api/products/:id/archive
 * Toggle archive/active status
 */
productRouter.patch('/:id/archive', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const product = productDb.getProductByIdOrSlug(id);

  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  const newArchived = !product.isArchived;
  productDb.setProductArchive(id, newArchived, req.admin!.username);

  const actionName = newArchived ? 'PRODUCT_ARCHIVED' : 'PRODUCT_RESTORED';
  logAudit(actionName, 'product', `${newArchived ? 'بایگانی' : 'بازیابی'} قطعه ${product.code}`, req, id);

  res.json({ success: true, isArchived: newArchived });
});

/**
 * POST /api/products/:id/duplicate
 * Duplicate an existing bearing product
 */
productRouter.post('/:id/duplicate', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const duplicated = productDb.duplicateProduct(id, req.admin!.username);

  if (!duplicated) {
    res.status(404).json({ success: false, error: 'کالای مبدا یافت نشد.' });
    return;
  }

  logAudit('PRODUCT_DUPLICATED', 'product', `کالای ${duplicated.code} از روی شناسه ${id} تکثیر گردید.`, req, duplicated.id, {
    originalId: id,
    newCode: duplicated.code,
  });

  res.status(201).json({ success: true, product: duplicated });
});

/**
 * PATCH /api/products/:id/featured
 * Toggle or set featured status
 */
productRouter.patch('/:id/featured', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const product = productDb.getProductByIdOrSlug(id);

  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  const newFeatured = typeof req.body?.featured === 'boolean' ? req.body.featured : !product.featured;
  productDb.setProductFeatured(id, newFeatured, req.admin!.username);

  logAudit('PRODUCT_FEATURED_TOGGLED', 'product', `وضعیت کالا منتخب برای ${product.code} به ${newFeatured} تغییر یافت.`, req, id);

  res.json({ success: true, featured: newFeatured });
});

/**
 * PATCH /api/products/:id/stock
 * Toggle or set stock/inquiry status
 */
productRouter.patch('/:id/stock', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const product = productDb.getProductByIdOrSlug(id);

  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  const newStock = typeof req.body?.inStock === 'boolean' ? req.body.inStock : !product.inStock;
  productDb.setProductStock(id, newStock, req.admin!.username);

  logAudit('PRODUCT_STOCK_TOGGLED', 'product', `وضعیت موجودی انبار برای ${product.code} به ${newStock} تغییر یافت.`, req, id);

  res.json({ success: true, inStock: newStock });
});

/**
 * DELETE /api/products/:id
 * Delete product permanently
 */
productRouter.delete('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const product = productDb.getProductByIdOrSlug(id);

  if (!product) {
    res.status(404).json({ error: 'کالا یافت نشد.' });
    return;
  }

  productDb.deleteProduct(id);
  logAudit('PRODUCT_DELETED', 'product', `حذف دائم قطعه ${product.code} از سیستم`, req, id);

  res.json({ success: true, message: `قطعه ${product.code} با موفقیت حذف گردید.` });
});
