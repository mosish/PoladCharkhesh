/**
 * POLAD CHARKHESH - MEDIA ASSET METADATA & UPLOAD ROUTER
 * 
 * Domain boundary for media assets, technical diagrams, authenticated uploads,
 * product gallery transactions, and reference-aware deletions.
 */

import express, { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config';
import { requireAuth, logAudit } from '../middleware';
import { mediaDb } from '../services/mediaDb';
import { validateMediaPayload } from '../validation';

export const mediaRouter = Router();

const uploadDirectory = path.join(path.dirname(CONFIG.DATABASE_PATH), 'uploads');

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
 * GET /api/media/products/:id
 * Retrieve gallery images and datasheet for product
 */
mediaRouter.get('/products/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const media = mediaDb.getProductMedia(id);
  if (!media) {
    res.status(404).json({ error: 'کالای مورد نظر یافت نشد.' });
    return;
  }
  res.json({ success: true, ...media });
});

/**
 * PATCH /api/media/products/:id
 * Update product gallery (attach, detach, primary, move, setPdf, clearPdf)
 */
mediaRouter.patch('/products/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const { action, mediaUrl, toIndex } = req.body || {};
  if (!action || !['attach', 'detach', 'primary', 'move', 'setPdf', 'clearPdf'].includes(action)) {
    res.status(400).json({ error: 'عملیات گالری نامعتبر است.' });
    return;
  }
  try {
    const updated = mediaDb.updateProductMediaGallery(id, { action, mediaUrl, toIndex }, req.admin!.username);
    logAudit('PRODUCT_GALLERY_UPDATED', 'product', `گالری کالا تغییر یافت: ${action}`, req, id);
    res.json({ success: true, gallery: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'خطا در اعمال تغییرات گالری.' });
  }
});

/**
 * GET /api/media/references/:id
 * Check which products or CMS sections reference this media item
 */
mediaRouter.get('/references/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const item = mediaDb.getMediaById(id);
  if (!item) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }
  const inUse = mediaDb.getReferences(item.url);
  res.json({ inUse });
});

/**
 * POST /api/media/upload
 * Authenticated physical upload for JPEG, PNG, WebP and PDF (up to 10MB)
 */
mediaRouter.post(
  '/upload',
  requireAuth,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], limit: '10mb' }),
  (req: Request, res: Response): void => {
    const bytes = req.body;
    if (!Buffer.isBuffer(bytes) || bytes.length < 12) {
      res.status(400).json({ error: 'لطفاً یک فایل معتبر تصویری (JPEG, PNG, WebP) یا سندی (PDF) با حجم حداکثر ۱۰ مگابایت انتخاب فرمایید.' });
      return;
    }

    const mime = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const signatures: Record<string, boolean> = {
      'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
      'image/png': bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      'image/webp': bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
      'application/pdf': bytes.toString('ascii', 0, 5) === '%PDF-',
    };

    if (!mime || !signatures[mime]) {
      res.status(400).json({ error: 'محتوای فایل با نوع MIME اعلام‌شده تطابق ندارد.' });
      return;
    }

    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    const extension = extensionMap[mime] || 'bin';
    const filename = `${randomUUID()}.${extension}`;

    let originalName = filename;
    try {
      if (req.headers['x-file-name']) {
        originalName = decodeURIComponent(String(req.headers['x-file-name'])).slice(0, 255);
      }
    } catch {
      originalName = filename;
    }

    fs.mkdirSync(uploadDirectory, { recursive: true });
    fs.writeFileSync(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });

    const category = mime === 'application/pdf' ? 'datasheet_pdf' : 'product_photo';
    let created;
    try { created = mediaDb.createMediaRecord(
      {
        filename,
        originalName,
        mimeType: mime,
        sizeBytes: bytes.length,
        url: `/uploads/${filename}`,
        category,
        associatedProductCodes: [],
      },
      req.admin!.username
    ); } catch (error) {
      fs.unlinkSync(path.join(uploadDirectory, filename));
      throw error;
    }

    logAudit('MEDIA_UPLOADED', 'media', `فایل جدید (${originalName}) با موفقیت بارگذاری گردید.`, req, created.id);
    res.status(201).json({ success: true, media: created });
  }
);

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

  if (mediaDb.getMediaList().some(item => item.url === validation.sanitized!.url)) { res.status(409).json({ error: 'Media URL already registered' }); return; }
  const created = mediaDb.createMediaRecord(validation.sanitized as any, req.admin!.username);
  logAudit('MEDIA_UPDATED', 'media', `رسانه جدید (${created.originalName}) ثبت گردید.`, req, created.id);

  res.status(201).json({ success: true, media: created });
});

/**
 * PUT /api/media/:id
 * Update media metadata (Protected)
 */
mediaRouter.put('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const validation = validateMediaPayload(req.body, true);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const existing = mediaDb.getMediaById(id);
  if (existing && ['url','filename','mimeType','sizeBytes'].some(key => req.body[key] !== undefined && req.body[key] !== (existing as any)[key])) {
    res.status(409).json({ error: 'File identity cannot be changed; register a new asset' }); return;
  }
  const updated = mediaDb.updateMediaRecord(id, validation.sanitized || {});
  if (!updated) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }

  logAudit('MEDIA_UPDATED', 'media', `اطلاعات رسانه ${updated.originalName} به‌روزرسانی شد.`, req, id);
  res.json({ success: true, media: updated });
});

/**
 * DELETE /api/media/:id
 * Remove unreferenced metadata; retain bytes for recoverable backups (Protected)
 */
mediaRouter.delete('/:id', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const current = mediaDb.getMediaById(id);
  if (!current) {
    res.status(404).json({ error: 'رسانه مورد نظر یافت نشد.' });
    return;
  }

  const deleteResult = mediaDb.deleteMediaRecord(id);
  if (!deleteResult.success) {
    if (deleteResult.inUse && deleteResult.inUse.length > 0) {
      res.status(409).json({
        error: `این رسانه در کاتالوگ یا بخش‌های زیر در حال استفاده است و قابل حذف نیست: ${deleteResult.inUse.join('، ')}`,
        inUse: deleteResult.inUse,
      });
      return;
    }
    res.status(500).json({ error: 'حذف رسانه انجام نشد.' });
    return;
  }

  logAudit('MEDIA_DELETED', 'media', `رسانه ${current.originalName} با موفقیت حذف شد.`, req, id);
  res.json({ success: true, unlinked: deleteResult.unlinked });
});
