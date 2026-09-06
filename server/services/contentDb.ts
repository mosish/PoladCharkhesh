/**
 * POLAD CHARKHESH - CMS CONTENT DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import { DEFAULT_PAGE_CONTENT } from '../../src/services/dataService';
import { CmsPageContent } from '../../src/types/admin';

export { DEFAULT_PAGE_CONTENT };

export const contentDb = {
  getPageContent(): CmsPageContent {
    const db = getDatabase();
    const row = db.prepare('SELECT data FROM cms_content WHERE id = ?;').get('main') as any;
    if (row && row.data) {
      try {
        return JSON.parse(row.data);
      } catch {
        return DEFAULT_PAGE_CONTENT;
      }
    }
    return DEFAULT_PAGE_CONTENT;
  },

  updatePageContent(sanitizedUpdates: Partial<CmsPageContent>, username: string): CmsPageContent {
    const current = this.getPageContent();
    const merged: CmsPageContent = {
      hero: { ...current.hero, ...(sanitizedUpdates.hero || {}) },
      about: { ...current.about, ...(sanitizedUpdates.about || {}) },
      footer: { ...current.footer, ...(sanitizedUpdates.footer || {}) },
    };

    const db = getDatabase();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO cms_content (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
    `).run(JSON.stringify(merged), nowIso, username);

    return merged;
  },
};
