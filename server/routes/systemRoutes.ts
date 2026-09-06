import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, logAudit } from '../middleware';
import { systemDb } from '../services/systemDb';
import { validateProductCandidate } from '../validation';

export const systemRouter = Router();

/**
 * GET /api/system/audit-logs
 * Protected audit logs list
 */
systemRouter.get('/audit-logs', requireAuth, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const entity = req.query.entity ? String(req.query.entity) : null;
  const action = req.query.action ? String(req.query.action) : null;

  const logs = systemDb.getAuditLogs(limit, entity, action);
  res.json({ logs });
});

/**
 * GET /api/system/backup
 * Secure admin export of database content.
 * CRITICAL SECURITY INVARIANT:
 * Passwords, hashes, salts, and active session tokens are EXCLUDED.
 */
systemRouter.get('/backup', requireAuth, (req: Request, res: Response) => {
  const snapshot = systemDb.exportSystemSnapshot(req.admin!.username);

  logAudit(
    'BACKUP_EXPORTED',
    'system',
    `پشتیبان‌گیری کامل از اطلاعات سیستم (${snapshot.products.length} کالا) صادر شد.`,
    req
  );

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
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

  try {
    const result = systemDb.restoreSystemSnapshot(backup, req.admin!.username);

    logAudit(
      'BACKUP_IMPORTED',
      'system',
      `بازیابی پایگاه داده از پشتیبان با موفقیت انجام شد (${result.restoredProductsCount} کالا).`,
      req
    );

    res.json({
      success: true,
      message: `بازیابی موفقیت‌آمیز ${result.restoredProductsCount} کالا و تنظیمات انجام شد.`,
      productsCount: result.restoredProductsCount,
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
  try {
    const result = systemDb.factoryResetSystem(req.admin!.username);

    logAudit('SYSTEM_RESET', 'system', 'بازنشانی کاتالوگ به ۶۸ کالای استاندارد کارخانه انجام شد.', req);

    res.json({
      success: true,
      message: 'کاتالوگ و تنظیمات به ۶۸ کالای مهندسی پایه بازنشانی گردید.',
      productsCount: result.productsRestored,
    });
  } catch (err: any) {
    console.error('Factory reset failed:', err);
    res.status(500).json({ error: 'خطای سیستمی در بازنشانی اطلاعات کارخانه.' });
  }
});
