import { mediaDb } from './mediaDb';
import { validateContentPayload, validateMediaPayload } from '../validation';
/**
 * POLAD CHARKHESH - SYSTEM & AUDIT DATABASE ACCESS SERVICE
 */

import { getDatabase, runTransaction } from '../db';
import { productDb, rowToProduct } from './productDb';
import { companyDb } from './companyDb';
import { contentDb } from './contentDb';
import { seoDb } from './seoDb';
import { bearingProducts as canonicalProducts } from '../../src/data/products';
import { COMPANY_INFO as canonicalCompanyInfo } from '../../src/data/company';
import { DEFAULT_PAGE_CONTENT } from './contentDb';
import { DEFAULT_SEO_CONFIG } from './seoDb';

export const systemDb = {
  getAuditLogs(limit = 200, entity?: string | null, action?: string | null): any[] {
    const db = getDatabase();
    let sql = 'SELECT * FROM audit_logs';
    const conditions: string[] = [];
    const params: any[] = [];

    if (entity && entity !== 'ALL') {
      conditions.push('entity = ?');
      params.push(entity);
    }

    if (action && action !== 'ALL') {
      conditions.push('action = ?');
      params.push(action);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?;';
    params.push(Math.min(limit, 500));

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id || undefined,
      summary: r.summary,
      details: r.details ? JSON.parse(r.details) : undefined,
      performedBy: r.performed_by,
      ipAddress: r.ip_address || undefined,
    }));
  },

  exportSystemSnapshot(username: string): any {
    const db = getDatabase();

    const productRows = db.prepare('SELECT * FROM products ORDER BY created_at DESC;').all();
    const products = productRows.map(rowToProduct);
    const companyInfo = companyDb.getCompanyInfo();
    const pageContent = contentDb.getPageContent();
    const seoConfig = seoDb.getSeoConfig();

    const auditCountRow = db.prepare('SELECT COUNT(*) as c FROM audit_logs;').get() as any;
    const inqCountRow = db.prepare('SELECT COUNT(*) as c FROM inquiries;').get() as any;

    return {
      version: '2.1.0',
      media: mediaDb.getMediaList(undefined, true),
      exportedAt: new Date().toISOString(),
      exportedBy: username,
      products,
      companyInfo,
      pageContent,
      seoConfig,
      auditLogsCount: Number(auditCountRow.c),
      inquiriesCount: Number(inqCountRow.c),
    };
  },

  restoreSystemSnapshot(snapshot: any, username: string): { restoredProductsCount: number } {
    const db = getDatabase();
    const currentProducts = productDb.getAllProducts(true);
    if (snapshot.pageContent) {
      const { revision, ...content } = snapshot.pageContent;
      const validation = validateContentPayload(content);
      if (!validation.isValid) throw new Error(validation.errors.join(' '));
    }
    if (snapshot.media !== undefined && (!Array.isArray(snapshot.media) || snapshot.media.length > 10000)) throw new Error('Invalid media backup');
    for (const item of snapshot.media ?? []) {
      const validation = validateMediaPayload({
        originalName: item.originalName, mimeType: item.mimeType, url: item.url, sizeBytes: item.sizeBytes,
        altTextFa: item.altTextFa ?? '', altTextEn: item.altTextEn ?? '', category: item.category,
      });
      if (!validation.isValid) throw new Error(validation.errors.join(' '));
    }
    const fullSafetySnapshot = this.exportSystemSnapshot(username);

    return runTransaction(() => {
      // 1. Take pre-restore safety snapshot
      const safetySnapshot = {
        ...fullSafetySnapshot,
        timestamp: new Date().toISOString(),
        initiatedBy: username,
        productsCount: currentProducts.length,
        products: currentProducts,
      };

      db.prepare(`
        INSERT INTO backup_snapshots (id, created_at, created_by, reason, snapshot_data)
        VALUES (?, ?, ?, ?, ?);
      `).run(
        `snap_${Date.now()}`,
        new Date().toISOString(),
        username,
        'AUTOMATIC_PRE_RESTORE_SAFEGUARD',
        JSON.stringify(safetySnapshot)
      );

      // 2. Clear current products
      db.prepare('DELETE FROM products;').run();

      // 3. Insert restored products
      for (const prod of snapshot.products) {
        productDb.createProduct(prod, username);
      }

      // 4. Restore company info if present
      if (snapshot.companyInfo) {
        companyDb.updateCompanyInfo(snapshot.companyInfo, username);
      }

      // 5. Restore page content if present
      if (snapshot.pageContent) {
        const { revision, ...restoredContent } = snapshot.pageContent;
        contentDb.updatePageContent(restoredContent, username);
      }

      // 6. Restore seo config if present
      if (snapshot.seoConfig) {
        seoDb.updateSeoConfig(snapshot.seoConfig, username);
      }

      // Restore metadata by URL without removing assets absent from older backups.
      // Physical uploads are retained; back up the uploads directory alongside SQLite.
      for (const item of snapshot.media ?? []) {
        const existing = db.prepare('SELECT id FROM media_metadata WHERE url=?').get(item.url) as any;
        if (existing) {
          const current = mediaDb.getMediaById(existing.id)!;
          mediaDb.updateMetadata(current.id, { originalName: item.originalName, altTextFa: item.altTextFa ?? '', altTextEn: item.altTextEn ?? '', category: item.category, revision: current.revision });
        } else {
          mediaDb.createMediaRecord({ originalName: item.originalName, mimeType: item.mimeType, sizeBytes: item.sizeBytes, url: item.url, altTextFa: item.altTextFa ?? '', altTextEn: item.altTextEn ?? '', category: item.category }, username);
        }
        const restored = db.prepare('SELECT id FROM media_metadata WHERE url=?').get(item.url) as any;
        const archived = Boolean(item.isArchived) && mediaDb.getReferences(item.url).length === 0;
        db.prepare('UPDATE media_metadata SET is_archived=? WHERE id=?').run(archived ? 1 : 0, restored.id);
      }
      return {
        restoredProductsCount: snapshot.products.length,
      };
    });
  },

  factoryResetSystem(username: string): { productsRestored: number } {
    const db = getDatabase();

    return runTransaction(() => {
      // 1. Clear products
      db.prepare('DELETE FROM products;').run();

      // 2. Re-seed canonical 68 products
      for (const p of canonicalProducts) {
        productDb.createProduct(p, username);
      }

      // 3. Reset company info
      companyDb.updateCompanyInfo(canonicalCompanyInfo, username);

      // 4. Reset page content
      contentDb.updatePageContent(DEFAULT_PAGE_CONTENT, username);

      // 5. Reset SEO config
      seoDb.updateSeoConfig(DEFAULT_SEO_CONFIG, username);

      return {
        productsRestored: canonicalProducts.length,
      };
    });
  },
};
