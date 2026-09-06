/**
 * POLAD CHARKHESH - MEDIA METADATA DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import { MediaMetadata } from '../../src/types/admin';

export const mediaDb = {
  getMediaList(category?: string): MediaMetadata[] {
    const db = getDatabase();
    let sql = 'SELECT * FROM media_metadata';
    const params: any[] = [];

    if (category) {
      sql += ' WHERE mime_type LIKE ?';
      params.push(`%${category}%`);
    }

    sql += ' ORDER BY created_at DESC;';
    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      originalName: r.original_name,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      url: r.url,
      createdAt: r.created_at,
      createdBy: r.created_by || undefined,
    }));
  },

  getMediaById(id: string): MediaMetadata | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM media_metadata WHERE id = ? LIMIT 1;').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      url: row.url,
      createdAt: row.created_at,
      createdBy: row.created_by || undefined,
    };
  },

  createMediaRecord(
    data: { originalName: string; mimeType: string; sizeBytes: number; url: string; filename?: string },
    username: string
  ): MediaMetadata {
    const db = getDatabase();
    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const filename = data.filename || data.originalName;

    db.prepare(`
      INSERT INTO media_metadata (id, filename, original_name, mime_type, size_bytes, url, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `).run(id, filename, data.originalName, data.mimeType, data.sizeBytes, data.url, nowIso, username);

    return this.getMediaById(id)!;
  },
};
