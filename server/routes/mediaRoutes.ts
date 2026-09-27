/**
 * POLAD CHARKHESH - MEDIA ASSET METADATA ROUTER
 */

import { Router, Request, Response } from 'express';
import { requireAuth, logAudit } from '../middleware';
import { mediaDb } from '../services/mediaDb';
import { validateMediaPayload } from '../validation';

export const mediaRouter = Router();

mediaRouter.get('/', (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const media = mediaDb.getMediaList(category);
  res.json({ count: media.length, media });
});

mediaRouter.get('/:id', (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const item = mediaDb.getMediaById(id);
  if (!item) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }
  res.json({ media: item });
});

mediaRouter.post('/', requireAuth, (req: Request, res: Response): void => {
  const validation = validateMediaPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const created = mediaDb.createMediaRecord(validation.sanitized as any, req.admin!.username);
  logAudit('MEDIA_CREATED', 'media', `رسانه جدید (${created.originalName}) ثبت شد.`, req, created.id, {
    category: created.category,
  });

  res.status(201).json({ success: true, media: created });
});

mediaRouter.put('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const current = mediaDb.getMediaById(id);
  if (!current) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }

  const validation = validateMediaPayload(req.body, true);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const updated = mediaDb.updateMediaRecord(id, validation.sanitized || {});
  logAudit('MEDIA_UPDATED', 'media', `اطلاعات رسانه ${current.originalName} به‌روزرسانی شد.`, req, id);

  res.json({ success: true, media: updated });
});

mediaRouter.delete('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const current = mediaDb.getMediaById(id);
  if (!current) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }

  mediaDb.deleteMediaRecord(id);
  logAudit('MEDIA_DELETED', 'media', `رسانه ${current.originalName} از کتابخانه حذف شد.`, req, id);

  res.json({ success: true });
});
