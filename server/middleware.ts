import { Request, Response, NextFunction } from 'express';
import { verifySession, AuthenticatedAdmin, SessionRecord } from './auth';
import { CONFIG } from './config';
import { getDatabase } from './db';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      session?: SessionRecord;
      clientIp?: string;
    }
  }
}

/**
 * Extract client IP address safely
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Authentication middleware enforcing server-side session validity
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  req.clientIp = getClientIp(req);

  // 1. Check HttpOnly cookie
  let token = req.cookies?.[CONFIG.COOKIE_NAME];

  // 2. Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'احراز هویت الزامی است. لطفاً وارد حساب مدیریت شوید.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const sessionCheck = verifySession(token);
  if (!sessionCheck.valid || !sessionCheck.user || !sessionCheck.session) {
    // Clear cookie if present but invalid
    res.clearCookie(CONFIG.COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      secure: CONFIG.isProduction,
    });

    res.status(401).json({
      error: 'نشست کاربری نامعتبر یا منقضی شده است.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }

  req.admin = sessionCheck.user;
  req.session = sessionCheck.session;
  next();
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: ('superadmin' | 'editor')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'دسترسی غیرمجاز', code: 'UNAUTHORIZED' });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        error: 'سطح دسترسی شما برای این عملیات کافی نمی‌باشد.',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Audit log recording helper
 */
export function logAudit(
  action: string,
  entity: string,
  summary: string,
  req: Request,
  entityId?: string,
  details?: Record<string, any>
): void {
  try {
    const db = getDatabase();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const performedBy = req.admin ? req.admin.username : 'system';
    const ip = req.clientIp || getClientIp(req);
    const detailsJson = details ? JSON.stringify(details) : null;

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, entity, entity_id, summary, details, performed_by, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(id, timestamp, action, entity, entityId || null, summary, detailsJson, performedBy, ip);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}

/**
 * Sanitize object trees against prototype pollution
 */
export function preventPrototypePollution(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    cleanPrototype(req.body);
  }
  next();
}

function cleanPrototype(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  const dangerous = ['__proto__', 'constructor', 'prototype'];
  for (const key of dangerous) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete obj[key];
    }
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'object' && val !== null) {
        cleanPrototype(val);
      }
    }
  }
}

/**
 * Memory-based rate limiter for public endpoints (inquiry submission, login attempts)
 */
interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function createRateLimiter(options: { max: number; windowMs: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 1, resetAt: now + options.windowMs };
      rateBuckets.set(key, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: options.message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
