/**
 * POLAD CHARKHESH - MEDIA METADATA DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
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

  deleteMediaRecord(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM media_metadata WHERE id = ?;').run(id);
    return result.changes > 0;
  },
};
