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
        const parsed = JSON.parse(row.data) as Partial<CmsPageContent>;
        return {
          hero: { ...DEFAULT_PAGE_CONTENT.hero, ...(parsed.hero || {}) },
          about: { ...DEFAULT_PAGE_CONTENT.about, ...(parsed.about || {}) },
          catalog: { ...DEFAULT_PAGE_CONTENT.catalog, ...(parsed.catalog || {}) },
          tools: { ...DEFAULT_PAGE_CONTENT.tools, ...(parsed.tools || {}) },
          whyUs: { ...DEFAULT_PAGE_CONTENT.whyUs, ...(parsed.whyUs || {}) },
          industries: { ...DEFAULT_PAGE_CONTENT.industries, ...(parsed.industries || {}) },
          team: { ...DEFAULT_PAGE_CONTENT.team, ...(parsed.team || {}) },
          contact: { ...DEFAULT_PAGE_CONTENT.contact, ...(parsed.contact || {}) },
          footer: { ...DEFAULT_PAGE_CONTENT.footer, ...(parsed.footer || {}) },
          visibility: { ...DEFAULT_PAGE_CONTENT.visibility, ...(parsed.visibility || {}) },
        };
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
      catalog: { ...current.catalog, ...(sanitizedUpdates.catalog || {}) },
      tools: { ...current.tools, ...(sanitizedUpdates.tools || {}) },
      whyUs: { ...current.whyUs, ...(sanitizedUpdates.whyUs || {}) },
      industries: { ...current.industries, ...(sanitizedUpdates.industries || {}) },
      team: { ...current.team, ...(sanitizedUpdates.team || {}) },
      contact: { ...current.contact, ...(sanitizedUpdates.contact || {}) },
      footer: { ...current.footer, ...(sanitizedUpdates.footer || {}) },
      visibility: { ...current.visibility, ...(sanitizedUpdates.visibility || {}) },
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
