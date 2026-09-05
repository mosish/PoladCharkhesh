import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CONFIG } from './config';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbDir = path.dirname(CONFIG.DATABASE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(CONFIG.DATABASE_PATH);

    // Performance and safety pragmas
    dbInstance.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
    `);

    initSchema(dbInstance);
  }

  return dbInstance;
}

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    -- 1. Admins Table
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'superadmin',
      created_at TEXT NOT NULL,
      last_login TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT
    );

    -- 2. Sessions Table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    -- 3. Products Table (stores 68 audited bearings + admin additions)
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      name_fa TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_fa TEXT,
      description_en TEXT,
      in_stock INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      d_inner REAL NOT NULL,
      d_outer REAL NOT NULL,
      b_width REAL NOT NULL,
      weight_kg REAL,
      cr_kn REAL NOT NULL,
      cor_kn REAL NOT NULL,
      speed_grease_rpm REAL NOT NULL,
      speed_oil_rpm REAL NOT NULL,
      thermal_speed_rating_rpm REAL,
      cage_material_fa TEXT,
      cage_material_en TEXT,
      sealing_fa TEXT,
      sealing_en TEXT,
      clearance_options TEXT, -- JSON array
      schematic_type TEXT,
      r_min REAL,
      calculation_factor_e REAL,
      calculation_factor_y REAL,
      calculation_factor_y0 REAL,
      calculation_factor_y1 REAL,
      calculation_factor_y2 REAL,
      calculation_factor_f0 REAL,
      image_url TEXT,
      images TEXT, -- JSON array
      pdf_url TEXT,
      brands TEXT, -- JSON array
      applications_fa TEXT, -- JSON array
      applications_en TEXT, -- JSON array
      industry_ids TEXT, -- JSON array
      technical_sources TEXT, -- JSON array
      meta_title_fa TEXT,
      meta_title_en TEXT,
      meta_description_fa TEXT,
      meta_description_en TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);

    -- 4. Company Identity Table (Single record id = 'main')
    CREATE TABLE IF NOT EXISTS company_info (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    -- 5. CMS Page Content Table (Single record id = 'main')
    CREATE TABLE IF NOT EXISTS cms_content (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    -- 6. SEO Config Table (Single record id = 'main')
    CREATE TABLE IF NOT EXISTS seo_config (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    -- 7. Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      summary TEXT NOT NULL,
      details TEXT, -- JSON string
      performed_by TEXT NOT NULL,
      ip_address TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity);

    -- 8. Customer Inquiries Table
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      company TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      ip_address TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_timestamp ON inquiries(timestamp);

    -- 9. Media Metadata Table
    CREATE TABLE IF NOT EXISTS media_metadata (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT
    );

    -- 10. Database Backups History Table
    CREATE TABLE IF NOT EXISTS backup_snapshots (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      snapshot_data TEXT NOT NULL
    );
  `);
}

/**
 * Execute callback inside a database transaction
 */
export function runTransaction<T>(callback: (db: DatabaseSync) => T): T {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
