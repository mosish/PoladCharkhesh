import path from 'node:path';

export const CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'poladcharkhesh.sqlite'),
  
  SESSION_SECRET: process.env.SESSION_SECRET || 'polad_sec_key_prod_8f7b2c9d1e4a5f6e8b0a9c7d4e2f1a3b5c7d9e',
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
