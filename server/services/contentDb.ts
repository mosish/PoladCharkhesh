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
        const saved = JSON.parse(row.data) as Partial<CmsPageContent>;
        // Backward-compatible read migration: older installations may only contain
        // hero/about/footer. Merge every section with current defaults so a deploy
        // never requires destructive reset or a manual CMS migration.
        return {
          hero: { ...DEFAULT_PAGE_CONTENT.hero, ...(saved.hero || {}) },
          about: { ...DEFAULT_PAGE_CONTENT.about, ...(saved.about || {}) },
          catalog: { ...DEFAULT_PAGE_CONTENT.catalog, ...(saved.catalog || {}) },
          tools: { ...DEFAULT_PAGE_CONTENT.tools, ...(saved.tools || {}) },
          whyUs: { ...DEFAULT_PAGE_CONTENT.whyUs, ...(saved.whyUs || {}) },
          industries: { ...DEFAULT_PAGE_CONTENT.industries, ...(saved.industries || {}) },
          team: { ...DEFAULT_PAGE_CONTENT.team, ...(saved.team || {}) },
          contact: { ...DEFAULT_PAGE_CONTENT.contact, ...(saved.contact || {}) },
          footer: { ...DEFAULT_PAGE_CONTENT.footer, ...(saved.footer || {}) },
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
