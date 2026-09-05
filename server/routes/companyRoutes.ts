import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, logAudit } from '../middleware';
import { COMPANY_INFO as defaultCompanyInfo } from '../../src/data/company';

export const companyRouter = Router();

/**
 * GET /api/company
 * Public company identity & contact details
 */
companyRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const row = db.prepare('SELECT data FROM company_info WHERE id = ?;').get('main') as any;

  if (row && row.data) {
    try {
      res.json({ company: JSON.parse(row.data) });
      return;
    } catch {
      // fallback
    }
  }

  res.json({ company: defaultCompanyInfo });
});

/**
 * PUT /api/company
 * Protected update to company info
 */
companyRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const updates = req.body || {};
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  // Fetch current
  let current = { ...defaultCompanyInfo };
  const row = db.prepare('SELECT data FROM company_info WHERE id = ?;').get('main') as any;
  if (row && row.data) {
    try {
      current = JSON.parse(row.data);
    } catch {}
  }

  const merged = {
    ...current,
    ...updates,
  };

  db.prepare(`
    INSERT INTO company_info (id, data, updated_at, updated_by)
    VALUES ('main', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;
  `).run(JSON.stringify(merged), nowIso, req.admin!.username);

  logAudit('COMPANY_UPDATED', 'company', 'اطلاعات هویتی و تماس شرکت به‌روزرسانی شد.', req, 'main');

  res.json({ success: true, company: merged });
});
