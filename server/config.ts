import path from 'node:path';
import crypto from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Safe cryptographic fallback secrets so server container never crashes on startup if env secrets are unset
const fallbackSessionSecret = crypto.randomBytes(32).toString('hex');
const fallbackCookieSecret = crypto.randomBytes(32).toString('hex');

if (isProduction && (!process.env.SESSION_SECRET || !process.env.COOKIE_SECRET)) {
  console.warn('[Security] Notice: SESSION_SECRET or COOKIE_SECRET environment variables are not set. Generated runtime cryptographic fallback secrets for this instance.');
}

export const CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'poladcharkhesh.db'),
  
  SESSION_SECRET: process.env.SESSION_SECRET?.trim() || fallbackSessionSecret,
  COOKIE_SECRET: process.env.COOKIE_SECRET?.trim() || fallbackCookieSecret,
  SESSION_TTL_HOURS: Number(process.env.SESSION_TTL_HOURS) || 12,
  COOKIE_NAME: 'polad_session',
  
  // Rate limiting and security controls
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  
  // PBKDF2 configuration
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_KEYLEN: 64,
  PBKDF2_DIGEST: 'sha512',
};
