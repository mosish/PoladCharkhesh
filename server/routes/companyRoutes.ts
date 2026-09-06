import { Router, Request, Response } from 'express';
import { requireAuth, logAudit } from '../middleware';
import { companyDb } from '../services/companyDb';
import { validateCompanyPayload } from '../validation';

export const companyRouter = Router();

/**
 * GET /api/company
 * Public company identity & contact details
 */
companyRouter.get('/', (req: Request, res: Response) => {
  const company = companyDb.getCompanyInfo();
  res.json({ company });
});

/**
 * PUT /api/company
 * Protected update to company info
 */
companyRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const validation = validateCompanyPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const updated = companyDb.updateCompanyInfo(validation.sanitized!, req.admin!.username);
  logAudit('COMPANY_UPDATED', 'company', 'اطلاعات هویتی و تماس شرکت به‌روزرسانی شد.', req, 'main');

  res.json({ success: true, company: updated });
});
