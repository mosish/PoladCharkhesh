/**
 * POLAD CHARKHESH - MEDIA ASSET METADATA ROUTER
 */

import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth, logAudit } from '../middleware';
import { mediaDb } from '../services/mediaDb';
import { validateMediaPayload } from '../validation';
import { CONFIG } from '../config';

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

mediaRouter.post('/upload', requireAuth, (req: Request, res: Response): void => {
  const { originalName, mimeType, dataBase64, altTextFa, altTextEn, category, associatedProductCodes } = req.body || {};

  const allowedMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
  };

  if (!originalName || typeof originalName !== 'string' || !allowedMime[mimeType]) {
    res.status(400).json({ error: 'نوع فایل یا نام فایل نامعتبر است.' });
    return;
  }
  if (!dataBase64 || typeof dataBase64 !== 'string') {
    res.status(400).json({ error: 'داده فایل ارسال نشده است.' });
    return;
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(dataBase64, 'base64');
  } catch {
    res.status(400).json({ error: 'ساختار داده فایل نامعتبر است.' });
    return;
  }

  const maxBytes = 10 * 1024 * 1024;
  if (bytes.length === 0 || bytes.length > maxBytes) {
    res.status(413).json({ error: 'حجم فایل باید کمتر از ۱۰ مگابایت باشد.' });
    return;
  }

  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  const safeBase = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'asset';
  const storedName = `${Date.now()}-${safeBase}${allowedMime[mimeType]}`;
  const targetPath = path.join(CONFIG.UPLOAD_DIR, storedName);
  fs.writeFileSync(targetPath, bytes);

  const draft = {
    originalName: originalName.trim(),
    filename: storedName,
    mimeType,
    sizeBytes: bytes.length,
    url: `/uploads/${storedName}`,
    altTextFa: typeof altTextFa === 'string' ? altTextFa : '',
    altTextEn: typeof altTextEn === 'string' ? altTextEn : '',
    category,
    associatedProductCodes: Array.isArray(associatedProductCodes) ? associatedProductCodes : [],
  };

  const validation = validateMediaPayload(draft);
  if (!validation.isValid) {
    try { fs.unlinkSync(targetPath); } catch {}
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const created = mediaDb.createMediaRecord(validation.sanitized as any, req.admin!.username);
  logAudit('MEDIA_CREATED', 'media', `فایل ${created.originalName} آپلود و ثبت شد.`, req, created.id, {
    category: created.category,
    sizeBytes: created.sizeBytes,
  });

  res.status(201).json({ success: true, media: created });
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

  if (current.url.startsWith('/uploads/')) {
    const storedName = path.basename(current.url);
    const targetPath = path.join(CONFIG.UPLOAD_DIR, storedName);
    try {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    } catch (error) {
      console.warn('[Media] Failed to remove uploaded file:', error);
    }
  }

  logAudit('MEDIA_DELETED', 'media', `رسانه ${current.originalName} از کتابخانه حذف شد.`, req, id);

  res.json({ success: true });
});
