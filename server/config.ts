import path from 'node:path';
import crypto from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';

function getSecret(name: 'SESSION_SECRET' | 'COOKIE_SECRET'): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) throw new Error(`[Security] ${name} is required in production.`);
  return crypto.randomBytes(32).toString('hex');
}

export const CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  // Opt in only for a same-host Nginx proxy. Never trust arbitrary forwarded headers.
  TRUST_PROXY: process.env.TRUST_PROXY === 'loopback' ? 'loopback' : false,
  
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'poladcharkhesh.db'),
  
  SESSION_SECRET: getSecret('SESSION_SECRET'),
  COOKIE_SECRET: getSecret('COOKIE_SECRET'),
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
