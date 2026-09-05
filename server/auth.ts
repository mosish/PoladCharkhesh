import crypto from 'node:crypto';
import { getDatabase } from './db';
import { CONFIG } from './config';

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'superadmin' | 'editor';
  createdAt: string;
  lastLogin?: string;
}

export interface SessionRecord {
  id: string;
  adminId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isRevoked: number;
}

/**
 * Hash password using cryptographically secure PBKDF2-HMAC-SHA512
 * Format: pbkdf2:100000:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    crypto.pbkdf2(
      password,
      salt,
      CONFIG.PBKDF2_ITERATIONS,
      CONFIG.PBKDF2_KEYLEN,
      CONFIG.PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) return reject(err);
        const hash = derivedKey.toString('hex');
        resolve(`pbkdf2:${CONFIG.PBKDF2_ITERATIONS}:${salt}:${hash}`);
      }
    );
  });
}

/**
 * Verify password against stored PBKDF2 hash using constant-time comparison
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
        return resolve(false);
      }

      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalHash = parts[3];

      crypto.pbkdf2(
        password,
        salt,
        iterations,
        CONFIG.PBKDF2_KEYLEN,
        CONFIG.PBKDF2_DIGEST,
        (err, derivedKey) => {
          if (err) return resolve(false);
          const computedHash = derivedKey.toString('hex');

          // Timing-safe buffer comparison to prevent timing attacks
          const originalBuffer = Buffer.from(originalHash, 'hex');
          const computedBuffer = Buffer.from(computedHash, 'hex');

          if (originalBuffer.length !== computedBuffer.length) {
            return resolve(false);
          }

          resolve(crypto.timingSafeEqual(originalBuffer, computedBuffer));
        }
      );
    } catch {
      resolve(false);
    }
  });
}

/**
 * Generate high-entropy 256-bit cryptographic token (64 hex characters)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if the master admin account has been provisioned
 */
export function isMasterAdminConfigured(): boolean {
  const db = getDatabase();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM admins;').get() as { count: number | bigint };
  return Number(countRow.count) > 0;
}

/**
 * Check rate limit and account lockout status
 */
export function checkRateLimit(username: string): { allowed: boolean; remainingSeconds?: number } {
  const db = getDatabase();
  const admin = db.prepare('SELECT failed_attempts, locked_until FROM admins WHERE LOWER(username) = LOWER(?);').get(username) as {
    failed_attempts: number;
    locked_until: string | null;
  } | undefined;

  if (!admin) {
    return { allowed: true };
  }

  if (admin.locked_until) {
    const lockedUntilTime = new Date(admin.locked_until).getTime();
    const now = Date.now();
    if (lockedUntilTime > now) {
      const remainingSeconds = Math.ceil((lockedUntilTime - now) / 1000);
      return { allowed: false, remainingSeconds };
    } else {
      // Lockout expired, reset lockout in DB
      db.prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE LOWER(username) = LOWER(?);').run(username);
    }
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt and apply brute-force lockout if threshold reached
 */
export function recordFailedLogin(username: string): { locked: boolean; remainingSeconds?: number } {
  const db = getDatabase();
  const admin = db.prepare('SELECT failed_attempts FROM admins WHERE LOWER(username) = LOWER(?);').get(username) as {
    failed_attempts: number;
  } | undefined;

  if (!admin) {
    return { locked: false };
  }

  const newAttempts = (admin.failed_attempts || 0) + 1;

  if (newAttempts >= CONFIG.MAX_FAILED_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + CONFIG.LOCKOUT_DURATION_MS).toISOString();
    db.prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE LOWER(username) = LOWER(?);').run(
      newAttempts,
      lockUntil,
      username
    );
    return { locked: true, remainingSeconds: Math.ceil(CONFIG.LOCKOUT_DURATION_MS / 1000) };
  } else {
    db.prepare('UPDATE admins SET failed_attempts = ? WHERE LOWER(username) = LOWER(?);').run(newAttempts, username);
    return { locked: false };
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetFailedLogin(username: string): void {
  const db = getDatabase();
  db.prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE LOWER(username) = LOWER(?);').run(username);
}

/**
 * Create a new server-side session stored in the database
 */
export function createSession(
  adminId: string,
  userAgent?: string,
  ipAddress?: string
): { token: string; expiresAt: string; user: AuthenticatedAdmin } {
  const db = getDatabase();
  const token = generateSessionToken();
  const now = new Date();
  const expiresDate = new Date(now.getTime() + CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000);

  const createdAt = now.toISOString();
  const expiresAt = expiresDate.toISOString();

  db.prepare(`
    INSERT INTO sessions (id, admin_id, user_agent, ip_address, created_at, expires_at, last_active_at, is_revoked)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0);
  `).run(token, adminId, userAgent || null, ipAddress || null, createdAt, expiresAt, createdAt);

  // Update admin's last_login
  db.prepare('UPDATE admins SET last_login = ? WHERE id = ?;').run(createdAt, adminId);

  const adminRow = db.prepare(`
    SELECT id, username, name, email, role, created_at, last_login
    FROM admins WHERE id = ?;
  `).get(adminId) as any;

  const user: AuthenticatedAdmin = {
    id: adminRow.id,
    username: adminRow.username,
    name: adminRow.name,
    email: adminRow.email,
    role: adminRow.role,
    createdAt: adminRow.created_at,
    lastLogin: adminRow.last_login,
  };

  return { token, expiresAt, user };
}

/**
 * Validate session token against database.
 * Completely immune to client tampering.
 */
export function verifySession(token: string): { valid: boolean; user?: AuthenticatedAdmin; session?: SessionRecord } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const db = getDatabase();
  const session = db.prepare(`
    SELECT s.id, s.admin_id, s.user_agent, s.ip_address, s.created_at, s.expires_at, s.last_active_at, s.is_revoked,
           a.id as a_id, a.username as a_username, a.name as a_name, a.email as a_email, a.role as a_role,
           a.created_at as a_created_at, a.last_login as a_last_login
    FROM sessions s
    JOIN admins a ON s.admin_id = a.id
    WHERE s.id = ? AND s.is_revoked = 0;
  `).get(token) as any;

  if (!session) {
    return { valid: false };
  }

  const expiresTime = new Date(session.expires_at).getTime();
  if (Date.now() > expiresTime) {
    // Session expired
    db.prepare('UPDATE sessions SET is_revoked = 1 WHERE id = ?;').run(token);
    return { valid: false };
  }

  // Update last active time periodically
  const nowIso = new Date().toISOString();
  db.prepare('UPDATE sessions SET last_active_at = ? WHERE id = ?;').run(nowIso, token);

  const user: AuthenticatedAdmin = {
    id: session.a_id,
    username: session.a_username,
    name: session.a_name,
    email: session.a_email,
    role: session.a_role,
    createdAt: session.a_created_at,
    lastLogin: session.a_last_login,
  };

  const sessionRecord: SessionRecord = {
    id: session.id,
    adminId: session.admin_id,
    userAgent: session.user_agent,
    ipAddress: session.ip_address,
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    lastActiveAt: nowIso,
    isRevoked: session.is_revoked,
  };

  return { valid: true, user, session: sessionRecord };
}

/**
 * Invalidate a session token (Logout)
 */
export function revokeSession(token: string): void {
  const db = getDatabase();
  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE id = ?;').run(token);
}

/**
 * Invalidate all sessions for an admin (e.g. after password change)
 */
export function revokeAllSessions(adminId: string): void {
  const db = getDatabase();
  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE admin_id = ?;').run(adminId);
}
