import { Router, Request, Response } from 'express';
import { 
  isMasterAdminConfigured, 
  hashPassword, 
  verifyPassword, 
  createSession, 
  verifySession, 
  revokeSession, 
  checkRateLimit, 
  recordFailedLogin, 
  resetFailedLogin 
} from '../auth';
import { getDatabase } from '../db';
import { CONFIG } from '../config';
import { requireAuth, logAudit, createRateLimiter } from '../middleware';

export const authRouter = Router();

// Login rate limiter: max 15 requests per 5 minutes per IP
const loginRateLimiter = createRateLimiter({
  max: 15,
  windowMs: 5 * 60 * 1000,
  message: 'تعداد درخواست‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه دیگر تلاش فرمایید.',
});

/**
 * GET /api/auth/status
 * Returns system setup status and active session info
 */
authRouter.get('/status', (req: Request, res: Response) => {
  const isConfigured = isMasterAdminConfigured();
  
  let token = req.cookies?.[CONFIG.COOKIE_NAME];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }

  if (token) {
    const check = verifySession(token);
    if (check.valid && check.user) {
      res.json({
        isConfigured,
        isAuthenticated: true,
        user: check.user,
      });
      return;
    }
  }

  res.json({
    isConfigured,
    isAuthenticated: false,
  });
});

/**
 * POST /api/auth/setup
 * First-time server-side master admin initialization
 */
authRouter.post('/setup', async (req: Request, res: Response): Promise<void> => {
  if (isMasterAdminConfigured()) {
    res.status(403).json({
      error: 'حساب کاربری مدیریت ارشد قبلاً پیکربندی گردیده است.',
      code: 'ALREADY_CONFIGURED',
    });
    return;
  }

  const { username, password, name, email } = req.body || {};

  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanUsername || cleanUsername.length < 3) {
    res.status(400).json({ error: 'نام کاربری باید حداقل شامل ۳ کاراکتر باشد.' });
    return;
  }

  if (!cleanPassword || cleanPassword.length < 8) {
    res.status(400).json({ error: 'رمز عبور باید حداقل دارای ۸ کاراکتر باشد.' });
    return;
  }

  try {
    const passwordHash = await hashPassword(cleanPassword);
    const adminId = `usr_admin_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const db = getDatabase();
    db.prepare(`
      INSERT INTO admins (id, username, password_hash, name, email, role, created_at, last_login, failed_attempts, locked_until)
      VALUES (?, ?, ?, ?, ?, 'superadmin', ?, ?, 0, NULL);
    `).run(
      adminId,
      cleanUsername,
      passwordHash,
      name ? String(name).trim() : 'مدیریت ارشد سامانه',
      email ? String(email).trim() : `${cleanUsername}@poladcharkhesh.ir`,
      nowIso,
      nowIso
    );

    const session = createSession(adminId, req.headers['user-agent'], req.ip);

    // Set secure HttpOnly cookie
    res.cookie(CONFIG.COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: CONFIG.isProduction,
      sameSite: 'strict',
      maxAge: CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000,
      path: '/',
    });

    logAudit('SYSTEM_RESET', 'auth', `راه‌اندازی اولیه حساب مدیریت ارشد (${cleanUsername})`, req, adminId);

    res.status(201).json({
      success: true,
      user: session.user,
      token: session.token,
    });
  } catch (err: any) {
    console.error('Setup admin error:', err);
    res.status(500).json({ error: 'خطای سرور در ایجاد حساب کاربری ارشد' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with credentials and receive server session
 */
authRouter.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password, rememberMe } = req.body || {};

  const cleanUsername = String(username || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!cleanUsername || !rawPassword) {
    res.status(400).json({ error: 'لطفاً نام کاربری و رمز عبور را وارد فرمایید.' });
    return;
  }

  // 1. Check Rate Limit / Lockout
  const rateCheck = checkRateLimit(cleanUsername);
  if (!rateCheck.allowed) {
    logAudit('FAILED_LOGIN', 'auth', `ورود مسدود شد: قفل زمانی کاربر ${cleanUsername}`, req);
    res.status(429).json({
      error: `تعداد دفعات تلاش ناموفق بیش از حد مجاز بوده است. لطفاً ${rateCheck.remainingSeconds} ثانیه دیگر مجدداً تلاش نمایید.`,
      remainingLockoutSeconds: rateCheck.remainingSeconds,
    });
    return;
  }

  // 2. Fetch admin from database
  const db = getDatabase();
  const admin = db.prepare(`
    SELECT id, username, password_hash, name, email, role, created_at, last_login, failed_attempts
    FROM admins WHERE LOWER(username) = LOWER(?);
  `).get(cleanUsername) as any;

  if (!admin) {
    logAudit('FAILED_LOGIN', 'auth', `تلاش ناموفق برای کاربر ناشناس: ${cleanUsername}`, req);
    res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    return;
  }

  // 3. Verify cryptographically with PBKDF2
  const isMatch = await verifyPassword(rawPassword, admin.password_hash);
  if (!isMatch) {
    const lockInfo = recordFailedLogin(cleanUsername);
    logAudit('FAILED_LOGIN', 'auth', `رمز عبور نادرست برای کاربر: ${cleanUsername}`, req, admin.id);

    if (lockInfo.locked) {
      res.status(429).json({
        error: 'حساب کاربری به دلیل ۵ بار ورود ناموفق به مدت ۵ دقیقه مسدود شد.',
        remainingLockoutSeconds: lockInfo.remainingSeconds,
      });
      return;
    }

    res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    return;
  }

  // 4. Reset failed attempts
  resetFailedLogin(cleanUsername);

  // 5. Create session in DB
  const session = createSession(admin.id, req.headers['user-agent'], req.ip);

  // 6. Issue HttpOnly cookie
  const cookieMaxAge = rememberMe
    ? CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000
    : undefined; // session cookie if not rememberMe

  res.cookie(CONFIG.COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: CONFIG.isProduction,
    sameSite: 'strict',
    maxAge: cookieMaxAge,
    path: '/',
  });

  logAudit('LOGIN', 'auth', `ورود موفق مدیر سیستم (${admin.username})`, req, admin.id);

  res.json({
    success: true,
    user: session.user,
    token: session.token,
  });
});

/**
 * POST /api/auth/logout
 * Invalidate server session and clear cookie
 */
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  if (req.session) {
    revokeSession(req.session.id);
  }

  res.clearCookie(CONFIG.COOKIE_NAME, {
    httpOnly: true,
    secure: CONFIG.isProduction,
    sameSite: 'strict',
    path: '/',
  });

  logAudit('LOGOUT', 'auth', `خروج مدیر سیستم (${req.admin?.username})`, req, req.admin?.id);

  res.json({ success: true, message: 'خروج با موفقیت انجام شد.' });
});

/**
 * POST /api/auth/change-password
 * Change admin password with server-side validation & PBKDF2 re-hashing
 */
authRouter.post('/change-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'رمز عبور فعلی و رمز عبور جدید الزامی می‌باشند.' });
    return;
  }

  if (String(newPassword).length < 8) {
    res.status(400).json({ error: 'رمز عبور جدید باید حداقل دارای ۸ کاراکتر باشد.' });
    return;
  }

  const db = getDatabase();
  const adminRow = db.prepare('SELECT id, password_hash FROM admins WHERE id = ?;').get(req.admin!.id) as any;

  if (!adminRow) {
    res.status(404).json({ error: 'کاربر یافت نشد.' });
    return;
  }

  const isCurrentValid = await verifyPassword(String(currentPassword), adminRow.password_hash);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'رمز عبور فعلی نادرست است.' });
    return;
  }

  const newHash = await hashPassword(String(newPassword));
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?;').run(newHash, req.admin!.id);

  logAudit('PASSWORD_CHANGED', 'auth', 'رمز عبور مدیریت با موفقیت به‌روزرسانی شد.', req, req.admin!.id);

  res.json({ success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد.' });
});

/**
 * GET /api/auth/me
 * Current authenticated admin profile
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.admin });
});
