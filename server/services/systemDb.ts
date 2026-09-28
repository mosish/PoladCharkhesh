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
import { mediaDb } from './mediaDb';
import { inquiryDb } from './inquiryDb';

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
    const media = mediaDb.getMediaList();
    const inquiries = inquiryDb.getInquiries();

    const auditCountRow = db.prepare('SELECT COUNT(*) as c FROM audit_logs;').get() as any;
    const inqCountRow = db.prepare('SELECT COUNT(*) as c FROM inquiries;').get() as any;

    return {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: username,
      products,
      companyInfo,
      pageContent,
      seoConfig,
      media,
      inquiries,
      auditLogsCount: Number(auditCountRow.c),
      inquiriesCount: Number(inqCountRow.c),
    };
  },

  restoreSystemSnapshot(snapshot: any, username: string): { restoredProductsCount: number } {
    const db = getDatabase();
    const currentProducts = productDb.getAllProducts(true);

    return runTransaction(() => {
      // 1. Take pre-restore safety snapshot of all restorable business data.
      // Authentication credentials and active sessions are intentionally excluded.
      const safetySnapshot = {
        ...systemDb.exportSystemSnapshot(username),
        timestamp: new Date().toISOString(),
        initiatedBy: username,
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
        contentDb.updatePageContent(snapshot.pageContent, username);
      }

      // 6. Restore seo config if present
      if (snapshot.seoConfig) {
        seoDb.updateSeoConfig(snapshot.seoConfig, username);
      }

      // 7. Restore media metadata library.
      if (Array.isArray(snapshot.media)) {
        db.prepare('DELETE FROM media_metadata;').run();
        const mediaInsert = db.prepare(`
          INSERT INTO media_metadata (
            id, filename, original_name, mime_type, size_bytes, url, created_at, created_by,
            alt_text_fa, alt_text_en, category, associated_product_codes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);
        for (const item of snapshot.media) {
          mediaInsert.run(
            item.id,
            item.filename,
            item.originalName,
            item.mimeType,
            Number(item.sizeBytes) || 0,
            item.url,
            item.createdAt || new Date().toISOString(),
            item.createdBy || username,
            item.altTextFa || null,
            item.altTextEn || null,
            item.category || null,
            JSON.stringify(item.associatedProductCodes || [])
          );
        }
      }

      // 8. Restore customer inquiries with original ids, timestamps and triage state.
      if (Array.isArray(snapshot.inquiries)) {
        db.prepare('DELETE FROM inquiries;').run();
        const inquiryInsert = db.prepare(`
          INSERT INTO inquiries (id, timestamp, full_name, phone, message, company, email, status, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);
        for (const item of snapshot.inquiries) {
          inquiryInsert.run(
            item.id,
            item.timestamp,
            item.fullName,
            item.phone,
            item.message,
            item.company || null,
            item.email || null,
            item.status || 'new',
            item.ipAddress || null
          );
        }
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
