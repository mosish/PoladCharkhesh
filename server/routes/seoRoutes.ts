import { Router, Request, Response } from 'express';
import { requireAuth, logAudit } from '../middleware';
import { seoDb } from '../services/seoDb';
import { validateSeoPayload } from '../validation';
import { DEFAULT_SEO_CONFIG } from '../services/seoDb';

export const seoRouter = Router();
export { DEFAULT_SEO_CONFIG };

/**
 * GET /api/seo
 * Public site SEO configuration
 */
seoRouter.get('/', (req: Request, res: Response) => {
  const seo = seoDb.getSeoConfig();
  res.json({ seo });
});

/**
 * PUT /api/seo
 * Protected update to SEO config
 */
seoRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const validation = validateSeoPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const updated = seoDb.updateSeoConfig(validation.sanitized!, req.admin!.username);
  logAudit('SEO_UPDATED', 'seo', 'تنظیمات سئو و متاتگ‌های وب‌سایت به‌روزرسانی شد.', req, 'main');

  res.json({ success: true, seo: updated });
});
