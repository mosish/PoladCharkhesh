/**
 * POLAD CHARKHESH - SEO CONFIG DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import { DEFAULT_SEO_CONFIG } from '../../src/services/dataService';
import { SiteSeoConfig } from '../../src/types/admin';

export { DEFAULT_SEO_CONFIG };

export const seoDb = {
  getSeoConfig(): SiteSeoConfig {
    const db = getDatabase();
    const row = db.prepare('SELECT data FROM seo_config WHERE id = ?;').get('main') as any;
    if (row && row.data) {
      try {
        return JSON.parse(row.data);
      } catch {
        return DEFAULT_SEO_CONFIG;
      }
    }
    return DEFAULT_SEO_CONFIG;
  },

  updateSeoConfig(sanitizedUpdates: Partial<SiteSeoConfig>, username: string): SiteSeoConfig {
    const current = this.getSeoConfig();
    const merged = { ...current, ...sanitizedUpdates };
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO seo_config (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
    `).run(JSON.stringify(merged), nowIso, username);

    return merged;
  },
};
