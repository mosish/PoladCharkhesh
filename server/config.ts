import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation for production mode: fail fast immediately if mandatory secrets are missing
if (isProduction) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.trim() === '') {
    throw new Error('FATAL SECURITY CONFIGURATION ERROR: "SESSION_SECRET" environment variable is required in production.');
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.trim() === '') {
    throw new Error('FATAL SECURITY CONFIGURATION ERROR: "COOKIE_SECRET" environment variable is required in production.');
  }
}

export const CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'poladcharkhesh.sqlite'),
  
  // In development mode, provide explicitly documented dev-only fallback.
  // In production, the validation above guarantees environment variables are present.
  SESSION_SECRET: process.env.SESSION_SECRET || (isProduction ? '' : 'dev-only-insecure-session-secret-change-in-production'),
  COOKIE_SECRET: process.env.COOKIE_SECRET || (isProduction ? '' : 'dev-only-insecure-cookie-secret-change-in-production'),
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
