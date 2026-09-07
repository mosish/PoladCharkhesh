import path from 'node:path';

export interface AppConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  isProduction: boolean;
  DATABASE_PATH: string;
  SESSION_SECRET: string;
  COOKIE_SECRET: string;
  SESSION_TTL_HOURS: number;
  COOKIE_NAME: string;
  TRUST_PROXY: boolean | number | string;
  MAX_FAILED_LOGIN_ATTEMPTS: number;
  LOCKOUT_DURATION_MS: number;
  PBKDF2_ITERATIONS: number;
  PBKDF2_KEYLEN: number;
  PBKDF2_DIGEST: string;
}

/**
 * Validates and loads application configuration according to environment.
 * In production (NODE_ENV=production):
 * - SESSION_SECRET and COOKIE_SECRET MUST be explicitly defined in the environment.
 * - Missing or trivial secrets trigger an immediate, fatal fail-fast error.
 * - Generating runtime fallback or using default secrets in production is strictly prohibited.
 *
 * In development / test environments:
 * - Safe, explicitly documented local secrets are used when unset to allow smooth DX.
 */
export function validateAndLoadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const sessionSecretEnv = env.SESSION_SECRET?.trim();
  const cookieSecretEnv = env.COOKIE_SECRET?.trim();

  if (isProduction) {
    const missing: string[] = [];
    if (!sessionSecretEnv) {
      missing.push('SESSION_SECRET');
    }
    if (!cookieSecretEnv) {
      missing.push('COOKIE_SECRET');
    }

    if (missing.length > 0) {
      throw new Error(
        `[FATAL CONFIG ERROR] Production startup failed: Required security secrets missing (${missing.join(', ')}). ` +
        'In production mode (NODE_ENV=production), both SESSION_SECRET and COOKIE_SECRET must be explicitly provided ' +
        'via environment variables. Generating temporary random secrets or using defaults in production is strictly prohibited.'
      );
    }

    // Guard against known trivial or placeholder secrets in production
    const weakSecrets = ['secret', 'changeme', 'password', 'default', '123456', 'session_secret', 'cookie_secret'];
    if (weakSecrets.includes(sessionSecretEnv!.toLowerCase())) {
      throw new Error('[FATAL CONFIG ERROR] Production startup failed: SESSION_SECRET must not use a trivial or default value.');
    }
    if (weakSecrets.includes(cookieSecretEnv!.toLowerCase())) {
      throw new Error('[FATAL CONFIG ERROR] Production startup failed: COOKIE_SECRET must not use a trivial or default value.');
    }
  }

  // Development / Test safe fallbacks (clearly documented for non-production environments)
  const devSessionSecret = sessionSecretEnv || 'polad-dev-session-secret-local-development-only-min32char';
  const devCookieSecret = cookieSecretEnv || 'polad-dev-cookie-secret-local-development-only-min32char';

  // Explicit trust proxy configuration for reverse proxy deployment:
  // - In production behind reverse proxy (e.g. Nginx on VPS), defaults to 1 (trust 1 hop)
  // - In development, defaults to 'loopback'
  // - Can be explicitly overridden via TRUST_PROXY env variable ('false', '0', 'true', number, or subnet)
  let trustProxy: boolean | number | string = isProduction ? 1 : 'loopback';
  if (env.TRUST_PROXY !== undefined) {
    const tp = env.TRUST_PROXY.trim().toLowerCase();
    if (tp === 'false' || tp === '0') {
      trustProxy = false;
    } else if (tp === 'true') {
      trustProxy = true;
    } else if (!isNaN(Number(tp))) {
      trustProxy = Number(tp);
    } else {
      trustProxy = env.TRUST_PROXY.trim();
    }
  }

  return {
    PORT: 3000,
    HOST: '0.0.0.0',
    NODE_ENV: nodeEnv,
    isProduction,
    DATABASE_PATH: env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'poladcharkhesh.db'),
    SESSION_SECRET: isProduction ? sessionSecretEnv! : devSessionSecret,
    COOKIE_SECRET: isProduction ? cookieSecretEnv! : devCookieSecret,
    SESSION_TTL_HOURS: Number(env.SESSION_TTL_HOURS) || 12,
    COOKIE_NAME: 'polad_session',
    TRUST_PROXY: trustProxy,
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutes
    PBKDF2_ITERATIONS: 100000,
    PBKDF2_KEYLEN: 64,
    PBKDF2_DIGEST: 'sha512',
  };
}

export const CONFIG = validateAndLoadConfig();
