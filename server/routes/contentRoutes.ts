import { Router, Request, Response } from 'express';
import { requireAuth, logAudit } from '../middleware';
import { contentDb } from '../services/contentDb';
import { validateContentPayload } from '../validation';
import { DEFAULT_PAGE_CONTENT } from '../services/contentDb';

export const contentRouter = Router();
export { DEFAULT_PAGE_CONTENT };

/**
 * GET /api/content
 * Public CMS page content
 */
contentRouter.get('/', (req: Request, res: Response) => {
  const content = contentDb.getPageContent();
  res.json({ content });
});

/**
 * PUT /api/content
 * Protected update to CMS content
 */
contentRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const validation = validateContentPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const updated = contentDb.updatePageContent(validation.sanitized!, req.admin!.username);
  logAudit('CONTENT_UPDATED', 'content', 'محتوای متنی صفحات وب‌سایت ویرایش گردید.', req, 'main');

  res.json({ success: true, content: updated });
});
