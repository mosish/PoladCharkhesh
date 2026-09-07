/**
 * POLAD CHARKHESH - COMPANY DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import { CONFIG } from '../config';
import { COMPANY_INFO as canonicalCompanyInfo, CompanyContactInfo } from '../../src/data/company';

export const companyDb = {
  getCompanyInfo(): CompanyContactInfo {
    const db = getDatabase();
    const row = db.prepare('SELECT data FROM company_info WHERE id = ?;').get('main') as any;
    if (row && row.data) {
      try {
        return JSON.parse(row.data);
      } catch {
        if (CONFIG.isProduction) throw new Error('Authoritative company data is invalid');
        return canonicalCompanyInfo;
      }
    }
    if (CONFIG.isProduction) throw new Error('Authoritative company data is missing');
    return canonicalCompanyInfo;
  },

  updateCompanyInfo(sanitizedUpdates: Partial<CompanyContactInfo>, username: string): CompanyContactInfo {
    const current = this.getCompanyInfo();
    const merged = { ...current, ...sanitizedUpdates };
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO company_info (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
    `).run(JSON.stringify(merged), nowIso, username);

    return merged;
  },
};
