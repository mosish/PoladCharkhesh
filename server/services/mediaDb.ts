import { assetIdentity, isSafeAssetUrl } from '../assetUrls';
/**
 * POLAD CHARKHESH - MEDIA METADATA DATABASE ACCESS SERVICE
 */

import { getDatabase, runTransaction } from '../db';
import { MediaMetadata, MediaUploadInput, MediaUpdateInput } from '../../src/types/admin';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToMedia(r: any): MediaMetadata {
  return {
    id: r.id,
    filename: r.filename,
    originalName: r.original_name,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes) || 0,
    url: r.url,
    createdAt: r.created_at,
    createdBy: r.created_by || undefined,
    altTextFa: r.alt_text_fa || undefined,
    altTextEn: r.alt_text_en || undefined,
    category: r.category || undefined,
    associatedProductCodes: safeJsonParse<string[]>(r.associated_product_codes, []),
  };
}

export const mediaDb = {
  getReferences(url: string): string[] {
    const db = getDatabase();
    const refs: string[] = [];
    const identity = assetIdentity(url);
    const references = (value: unknown): boolean => typeof value === 'string' ? assetIdentity(value) === identity : Array.isArray(value) ? value.some(references) : !!value && typeof value === 'object' ? Object.values(value).some(references) : false;
    const prods = db.prepare('SELECT id, code, image_url, images, pdf_url FROM products').all() as any[];
    for (const p of prods) {
      const images: string[] = safeJsonParse(p.images, []);
      if (references([p.image_url, ...images, p.pdf_url])) {
        refs.push(p.code);
      }
    }
    for (const table of ['cms_content', 'company_info', 'seo_config']) {
      try {
        const row = db.prepare(`SELECT data FROM ${table} WHERE id='main'`).get() as any;
        if (row && references(safeJsonParse(row.data, {}))) {
          refs.push(table);
        }
      } catch {}
    }
    return [...new Set(refs)];
  },

  getProductMedia(productIdOrCode: string) {
    const db = getDatabase();
    const row = db.prepare('SELECT id, code, image_url, images, pdf_url FROM products WHERE id = ? OR code = ?').get(productIdOrCode, productIdOrCode) as any;
    if (!row) return null;
    const images = [...new Set<string>([row.image_url, ...safeJsonParse<string[]>(row.images, [])].filter(Boolean))];
    return {
      productId: row.id,
      code: row.code,
      imageUrl: row.image_url || images[0] || '',
      images,
      pdfUrl: row.pdf_url || '',
    };
  },

  updateProductMediaGallery(
    productIdOrCode: string,
    input: {
      action: 'attach' | 'detach' | 'primary' | 'move' | 'setPdf' | 'clearPdf';
      mediaUrl?: string;
      toIndex?: number;
    },
    username: string
  ) {
    return runTransaction((db) => {
      const row = db.prepare('SELECT id, code, image_url, images, pdf_url FROM products WHERE id = ? OR code = ?').get(productIdOrCode, productIdOrCode) as any;
      if (!row) throw new Error('Product not found');
      let images: string[] = [...new Set<string>([row.image_url, ...safeJsonParse<string[]>(row.images, [])].filter(Boolean))];
      let pdfUrl = row.pdf_url || '';
      const url = input.mediaUrl || '';
      if (input.action !== 'clearPdf' && !isSafeAssetUrl(input.mediaUrl, false)) throw new Error('Invalid media URL');
      const metadata = this.getMediaList().find(m => m.url === url);
      if (input.action === 'setPdf' && metadata && metadata.mimeType !== 'application/pdf') throw new Error('Expected PDF');
      if (['attach','primary'].includes(input.action) && metadata?.mimeType === 'application/pdf') throw new Error('Expected image');
      if (['primary','move','detach'].includes(input.action) && !images.includes(url)) throw new Error('Image is not attached');
      if (input.action === 'move' && (!Number.isInteger(input.toIndex) || input.toIndex! < 0 || input.toIndex! >= images.length)) throw new Error('Invalid gallery position');

      switch (input.action) {
        case 'attach':
          if (url && !images.includes(url)) images.push(url);
          break;
        case 'detach':
          images = images.filter((img) => img !== url);
          break;
        case 'primary':
          if (url) {
            images = [url, ...images.filter((img) => img !== url)];
          }
          break;
        case 'move':
          if (url && typeof input.toIndex === 'number' && input.toIndex >= 0 && input.toIndex < images.length) {
            const idx = images.indexOf(url);
            if (idx >= 0) {
              images.splice(idx, 1);
              images.splice(input.toIndex, 0, url);
            }
          }
          break;
        case 'setPdf':
          pdfUrl = url;
          break;
        case 'clearPdf':
          pdfUrl = '';
          break;
        default:
          throw new Error('Invalid gallery action');
      }

      const primaryImage = images[0] || '';
      db.prepare('UPDATE products SET image_url = ?, images = ?, pdf_url = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run(primaryImage, JSON.stringify(images), pdfUrl, new Date().toISOString(), username, row.id);

      return {
        productId: row.id,
        code: row.code,
        imageUrl: primaryImage,
        images,
        pdfUrl,
      };
    });
  },

  getMediaList(category?: string): MediaMetadata[] {
    const db = getDatabase();
    const sql = category
      ? 'SELECT * FROM media_metadata WHERE category = ? ORDER BY created_at DESC;'
      : 'SELECT * FROM media_metadata ORDER BY created_at DESC;';
    const rows = (category ? db.prepare(sql).all(category) : db.prepare(sql).all()) as any[];
    return rows.map(rowToMedia);
  },

  getMediaById(id: string): MediaMetadata | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM media_metadata WHERE id = ? LIMIT 1;').get(id) as any;
    return row ? rowToMedia(row) : null;
  },

  createMediaRecord(data: MediaUploadInput, username: string): MediaMetadata {
    const db = getDatabase();
    if (!isSafeAssetUrl(data.url, false) || this.getMediaList().some(item => assetIdentity(item.url) === assetIdentity(data.url))) throw new Error('Invalid or duplicate media URL');
    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const filename = data.filename || data.originalName;

    db.prepare(`
      INSERT INTO media_metadata (
        id, filename, original_name, mime_type, size_bytes, url, created_at, created_by,
        alt_text_fa, alt_text_en, category, associated_product_codes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      id,
      filename,
      data.originalName,
      data.mimeType || 'application/octet-stream',
      Number(data.sizeBytes) || 0,
      data.url,
      nowIso,
      username,
      data.altTextFa || null,
      data.altTextEn || null,
      data.category || null,
      JSON.stringify(data.associatedProductCodes || [])
    );

    return this.getMediaById(id)!;
  },

  updateMediaRecord(id: string, updates: MediaUpdateInput): MediaMetadata | null {
    const existing = this.getMediaById(id);
    if (!existing) return null;

    for (const key of ['url','filename','mimeType','sizeBytes'] as const) {
      if (updates[key] !== undefined && updates[key] !== existing[key]) throw new Error('File identity cannot be changed; register a new asset');
    }
    const merged: MediaMetadata = {
      ...existing,
      ...updates,
      filename: updates.filename || existing.filename,
      originalName: updates.originalName || existing.originalName,
      mimeType: updates.mimeType || existing.mimeType,
      sizeBytes: updates.sizeBytes !== undefined ? Number(updates.sizeBytes) : existing.sizeBytes,
      url: updates.url || existing.url,
      associatedProductCodes: updates.associatedProductCodes || existing.associatedProductCodes || [],
    };

    const db = getDatabase();
    db.prepare(`
      UPDATE media_metadata SET
        filename = ?,
        original_name = ?,
        mime_type = ?,
        size_bytes = ?,
        url = ?,
        alt_text_fa = ?,
        alt_text_en = ?,
        category = ?,
        associated_product_codes = ?
      WHERE id = ?;
    `).run(
      merged.filename,
      merged.originalName,
      merged.mimeType,
      merged.sizeBytes,
      merged.url,
      merged.altTextFa || null,
      merged.altTextEn || null,
      merged.category || null,
      JSON.stringify(merged.associatedProductCodes || []),
      id
    );

    return this.getMediaById(id);
  },

  deleteMediaRecord(id: string): { success: boolean; inUse?: string[]; unlinked?: boolean } {
    const current = this.getMediaById(id);
    if (!current) return { success: false };

    const inUse = this.getReferences(current.url);
    const siblings = this.getMediaList().filter(item => item.id !== id && assetIdentity(item.url) === assetIdentity(current.url));
    inUse.push(...siblings.map(item => 'media:' + item.id));
    if (inUse.length > 0) {
      return { success: false, inUse };
    }

    const db = getDatabase();
    // Never unlink physical bytes here: safety snapshots and old backups may still
    // reference them. Removing a library record is reversible by restoring metadata.
    // Offline storage cleanup must reconcile all snapshots before removing bytes.
    const result = db.prepare('DELETE FROM media_metadata WHERE id = ?;').run(id);
    return { success: result.changes > 0, unlinked: false };

  },
};
