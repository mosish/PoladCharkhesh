/**
 * POLAD CHARKHESH - MEDIA ASSET METADATA ROUTER
 * 
 * Domain boundary for media assets and technical diagrams.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, logAudit } from '../middleware';
import { mediaDb } from '../services/mediaDb';
import { validateMediaPayload } from '../validation';

export const mediaRouter = Router();

/**
 * GET /api/media
 * Retrieve media metadata list
 */
mediaRouter.get('/', (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const media = mediaDb.getMediaList(category);
  res.json({ count: media.length, media });
});

/**
 * GET /api/media/:id
 * Retrieve single media item metadata
 */
mediaRouter.get('/:id', (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const item = mediaDb.getMediaById(id);
  if (!item) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }
  res.json({ media: item });
});

/**
 * POST /api/media
 * Register new media metadata (Protected - editor / superadmin)
 */
mediaRouter.post('/', requireAuth, (req: Request, res: Response): void => {
  const validation = validateMediaPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const created = mediaDb.createMediaRecord(req.body, req.admin!.username);
  logAudit('MEDIA_UPDATED', 'media', `رسانه جدید (${created.originalName}) ثبت گردید.`, req, created.id);

  res.status(201).json({ success: true, media: created });
});
