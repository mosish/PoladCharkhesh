import { getDatabase } from '../db';
import { DEFAULT_PAGE_CONTENT } from '../../src/data/contentDefaults';
import { mergeContent } from '../../src/utils/contentModel';
import type { CmsPageContent } from '../../src/types/admin';
export { DEFAULT_PAGE_CONTENT };

export const contentDb = {
  getPageContent(): CmsPageContent {
    const db = getDatabase();
    const row = db.prepare("SELECT data FROM cms_content WHERE id = 'main'").get() as any;
    const stored = row ? JSON.parse(row.data) : {};
    const content = { ...mergeContent(DEFAULT_PAGE_CONTENT, stored), revision: stored.revision ?? 0 };
    // Add newly managed content once. Never overwrite existing text, blanks, or removed items.
    if (!stored.copy) {
      db.prepare("INSERT INTO cms_content (id,data,updated_at,updated_by) VALUES ('main',?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data")
        .run(JSON.stringify(content), new Date().toISOString(), 'content-migration');
    }
    return content;
  },
  updatePageContent(updates: Partial<CmsPageContent>, username: string): CmsPageContent {
    const db = getDatabase();
    {
      const current = this.getPageContent();
      if (updates.revision !== undefined && updates.revision !== current.revision) {
        throw new Error('CONTENT_CONFLICT');
      }
      const merged = { ...mergeContent(current, updates), revision: (current.revision ?? 0) + 1 };
      const result = db.prepare("UPDATE cms_content SET data=?,updated_at=?,updated_by=? WHERE id='main' AND COALESCE(json_extract(data,'$.revision'),0)=?")
        .run(JSON.stringify(merged), new Date().toISOString(), username, current.revision ?? 0);
      if (!result.changes) throw new Error('CONTENT_CONFLICT');
      return merged;
    }
  },
};
