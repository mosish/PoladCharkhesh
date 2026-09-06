/**
 * POLAD CHARKHESH - INQUIRIES DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import { InquiryLog, InquiryStatus } from '../../src/types/admin';

export const inquiryDb = {
  getInquiries(): InquiryLog[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY timestamp DESC;').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      fullName: r.full_name,
      phone: r.phone,
      message: r.message,
      company: r.company || undefined,
      email: r.email || undefined,
      status: r.status as InquiryStatus,
      ipAddress: r.ip_address || undefined,
    }));
  },

  createInquiry(
    data: { fullName: string; phone: string; message: string; company?: string; email?: string },
    ip?: string
  ): string {
    const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const db = getDatabase();

    db.prepare(`
      INSERT INTO inquiries (id, timestamp, full_name, phone, message, company, email, status, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?);
    `).run(
      id,
      nowIso,
      data.fullName,
      data.phone,
      data.message,
      data.company || null,
      data.email || null,
      ip || null
    );

    return id;
  },

  updateInquiryStatus(id: string, status: string): boolean {
    const db = getDatabase();
    const res = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?;').run(status, id);
    return res.changes > 0;
  },
};
