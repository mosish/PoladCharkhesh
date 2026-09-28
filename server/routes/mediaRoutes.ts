import { Router, raw, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config';
import { requireAuth, logAudit } from '../middleware';
import { mediaDb, MediaError } from '../services/mediaDb';
import { validateMediaPayload } from '../validation';

export const mediaRouter = Router();
export const uploadDirectory = path.join(path.dirname(CONFIG.DATABASE_PATH), 'uploads');
mediaRouter.get('/library', requireAuth, (_req, res) => {
  const media = mediaDb.getMediaList(undefined, true); res.json({ media, count: media.length });
});
mediaRouter.get('/products/:id', requireAuth, (req, res) => {
  res.json({ gallery: mediaDb.getProductMedia(String(req.params.id)) });
});
mediaRouter.patch('/products/:id', requireAuth, (req, res): void => {
  if (!req.body || typeof req.body !== 'object' || typeof req.body.version !== 'string' || typeof req.body.action !== 'string' ||
      (req.body.mediaId !== undefined && typeof req.body.mediaId !== 'string')) {
    res.status(400).json({ error: 'Invalid gallery change request' }); return;
  }
  const gallery = mediaDb.changeProductMedia(String(req.params.id), req.body, req.admin!.username);
  logAudit('MEDIA_UPDATED', 'product', 'Product gallery: ' + String(req.body.action), req, String(req.params.id));
  res.json({ gallery });
});
mediaRouter.post('/upload', requireAuth, raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], limit: '10mb' }), (req, res): void => {
  const bytes = req.body;
  if (!Buffer.isBuffer(bytes) || bytes.length < 12) { res.status(400).json({ error: 'Choose a JPEG, PNG, WebP or PDF (maximum 10 MB)' }); return; }
  const mime = req.headers['content-type']?.split(';')[0];
  const signatures: Record<string, boolean> = {
    'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/webp': bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
    'application/pdf': bytes.toString('ascii', 0, 5) === '%PDF-',
  };
  if (!mime || !signatures[mime]) { res.status(400).json({ error: 'File content does not match its type' }); return; }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[mime];
  const filename = randomUUID() + '.' + extension;
  let originalName: string;
  try { originalName = decodeURIComponent(String(req.headers['x-file-name'] || filename)).slice(0,255); }
  catch { res.status(400).json({ error: 'Invalid filename' }); return; }
  fs.mkdirSync(uploadDirectory, { recursive: true });
  fs.writeFileSync(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });
  const media = mediaDb.createMediaRecord({ originalName, filename, mimeType: mime, sizeBytes: bytes.length, url: '/uploads/' + filename }, req.admin!.username);
  logAudit('MEDIA_UPDATED', 'media', 'Uploaded ' + originalName, req, media.id);
  res.status(201).json({ media });
});
mediaRouter.get('/', (req, res) => {
  const media = mediaDb.getMediaList(typeof req.query.category === 'string' ? req.query.category : undefined);
  res.json({ count: media.length, media });
});
mediaRouter.get('/:id', (req, res): void => {
  const media = mediaDb.getMediaById(String(req.params.id));
  if (!media || media.isArchived) { res.status(404).json({ error: 'Media not found' }); return; }
  res.json({ media });
});
mediaRouter.post('/', requireAuth, (req, res): void => {
  const validation = validateMediaPayload(req.body);
  if (!validation.isValid) { res.status(400).json({ error: validation.errors.join(' ') }); return; }
  const media = mediaDb.createMediaRecord(validation.sanitized, req.admin!.username);
  logAudit('MEDIA_UPDATED', 'media', 'Registered ' + media.originalName, req, media.id);
  res.status(201).json({ media });
});
mediaRouter.put('/:id', requireAuth, (req, res): void => {
  const validation = validateMediaPayload(req.body, true);
  if (!validation.isValid) { res.status(400).json({ error: validation.errors.join(' ') }); return; }
  // Asset URLs/types are immutable: register a new asset to keep every existing reference safe.
  if (['url', 'mimeType', 'sizeBytes', 'width', 'height'].some(key => key in req.body)) { res.status(400).json({ error: 'Asset identity is immutable' }); return; }
  const media = mediaDb.updateMetadata(String(req.params.id), validation.sanitized);
  logAudit('MEDIA_UPDATED', 'media', 'Updated metadata', req, media.id);
  res.json({ media });
});
mediaRouter.patch('/:id/archive', requireAuth, (req, res): void => {
  if (typeof req.body?.archived !== 'boolean') { res.status(400).json({ error: 'archived must be boolean' }); return; }
  const media = mediaDb.archive(String(req.params.id), req.body.archived);
  logAudit('MEDIA_UPDATED', 'media', media.isArchived ? 'Archived asset (file retained)' : 'Restored asset', req, media.id);
  res.json({ media });
});
mediaRouter.use((error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof MediaError) { res.status(error.status).json({ error: error.message }); return; }
  if (error.type === 'entity.too.large') { res.status(413).json({ error: 'Maximum upload size is 10 MB' }); return; }
  next(error);
});
