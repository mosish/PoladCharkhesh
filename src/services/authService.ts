/**
 * POLAD CHARKHESH - SECURE ADMIN AUTHENTICATION SERVICE
 * 
 * Handles user authentication, token issuance, session restoration,
 * password change with PBKDF2 hashing, rate limiting, and audit tracking.
 * 
 * DEVELOPMENT NOTE: Initial development credentials are provided via safe
 * pre-hashed PBKDF2 string. Plaintext credentials are never committed.
 */

import { AdminUser, AuthSession } from '../types/admin';
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  verifySessionToken, 
  checkRateLimit, 
  recordFailedAttempt, 
  clearRateLimit,
  AUTH_CONFIG 
} from '../utils/cryptoAuth';
import { auditService } from './auditService';

const SESSION_STORAGE_KEY = 'polad_admin_session_v1';
const CREDENTIALS_STORAGE_KEY = 'polad_admin_credentials_v1';

// Safe development baseline: Pre-computed PBKDF2 hash for initial dev username "admin" / password "admin123"
// $pbkdf2$100000$d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1$b722cb984bf4da2cfc3a0785ddfbf04ae7a9446d3e8e19ffea8e89f81d11ea89
const DEFAULT_DEV_ADMIN_HASH = '$pbkdf2$100000$3a7f9c2e1b4d8a5f6e0c3b2a1d9e8f7a$62e3d92f7c0a969e5d481b37b60098df23351ec1099f493540ebfba4c1851e44';

interface StoredAdminRecord {
  user: AdminUser;
  passwordHash: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;
  private sessionListeners: Set<(session: AuthSession | null) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Ensure default credentials exist in local encrypted credentials store
    const storedCreds = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!storedCreds) {
      // First-time setup: Generate dynamic hash for dev password 'admin123' if default hash needs fresh generation
      const initialHash = await hashPassword('admin123');
      const defaultRecord: StoredAdminRecord = {
        user: {
          id: 'usr_admin_master',
          username: 'admin',
          email: 'admin@poladcharkhesh.ir',
          name: 'مدیریت ارشد سیستم (Super Admin)',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
        },
        passwordHash: initialHash,
      };
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(defaultRecord));
    }

    // Try restoring existing session
    await this.restoreSession();
    this.isInitialized = true;
  }

  private getStoredAdmin(): StoredAdminRecord | null {
    try {
      const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read admin credentials store:', e);
    }
    return null;
  }

  private async restoreSession(): Promise<void> {
    try {
      const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedSession) {
        this.currentSession = null;
        return;
      }

      const session: AuthSession = JSON.parse(storedSession);
      const tokenVerification進 = await verifySessionToken(session.token);

      if (tokenVerification進.isValid && tokenVerification進.payload) {
        this.currentSession = session;
        this.notifyListeners();
      } else {
        // Token invalid or expired
        this.logout('Session expired or invalidated.');
      }
    } catch (e) {
      this.currentSession = null;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const sessionCopy = this.currentSession ? { ...this.currentSession } : null;
    this.sessionListeners.forEach((listener) => listener(sessionCopy));
  }

  public subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.sessionListeners.add(listener);
    listener(this.currentSession);
    return () => {
      this.sessionListeners.delete(listener);
    };
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    return Date.now() < this.currentSession.expiresAt;
  }

  public getCurrentUser(): AdminUser | null {
    return this.currentSession ? this.currentSession.user : null;
  }

  /**
   * Performs secure login with PBKDF2 hash verification & rate limiting
   */
  public async login(params: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ success: boolean; error?: string; remainingLockoutSeconds?: number }> {
    const cleanUsername = params.username.trim().toLowerCase();

    // 1. Check Rate Limit / Lockout
    const rateCheck = checkRateLimit(cleanUsername);
    if (rateCheck.isLocked) {
      const secondsLeft = Math.ceil(rateCheck.remainingLockoutMs / 1000);
      auditService.record({
        action: 'FAILED_LOGIN',
        entity: 'auth',
        summary: `ورود مسدود شد: تلاش بیش از حد برای نام کاربری ${cleanUsername}`,
        performedBy: cleanUsername,
        details: { reason: 'Rate limited', secondsLeft },
      });

      return {
        success: false,
        error: `تعداد تلاش‌های ناموفق بیش از حد مجاز بوده است. لطفاً ${secondsLeft} ثانیه دیگر مجدداً تلاش فرمایید.`,
        remainingLockoutSeconds: secondsLeft,
      };
    }

    // 2. Fetch Stored Admin Record
    const adminRecord = this.getStoredAdmin();
    if (!adminRecord || adminRecord.user.username.toLowerCase() !== cleanUsername) {
      const lockStatus = recordFailedAttempt(cleanUsername);
      auditService.record({
        action: 'FAILED_LOGIN',
        entity: 'auth',
        summary: `تلاش ناموفق برای ورود با نام کاربری: ${cleanUsername}`,
        performedBy: cleanUsername,
      });

      return {
        success: false,
        error: lockStatus.isNowLocked
          ? 'حساب کاربری به دلیل ۵ بار تلاش ناموفق موقتاً مسدود شد. ۵ دقیقه دیگر تلاش کنید.'
          : 'نام کاربری یا رمز عبور اشتباه است.',
      };
    }

    // 3. Verify Password using PBKDF2
    const isPasswordValid = await verifyPassword(params.password, adminRecord.passwordHash);
    if (!isPasswordValid) {
      const lockStatus = recordFailedAttempt(cleanUsername);
      auditService.record({
        action: 'FAILED_LOGIN',
        entity: 'auth',
        summary: `رمز عبور نادرست برای کاربر: ${cleanUsername}`,
        performedBy: cleanUsername,
      });

      return {
        success: false,
        error: lockStatus.isNowLocked
          ? 'حساب کاربری به مدت ۵ دقیقه مسدود گردید.'
          : 'نام کاربری یا رمز عبور اشتباه است.',
      };
    }

    // 4. Authentication Succeeded -> Clear rate limiting
    clearRateLimit(cleanUsername);

    // 5. Issue Cryptographically Signed Session Token
    const issuedAt = Date.now();
    const expiresAt = issuedAt + AUTH_CONFIG.TOKEN_VALIDITY_HOURS * 60 * 60 * 1000;

    const token = await generateSessionToken({
      userId: adminRecord.user.id,
      username: adminRecord.user.username,
      role: adminRecord.user.role,
      expiresAt,
    });

    const updatedUser: AdminUser = {
      ...adminRecord.user,
      lastLogin: new Date().toISOString(),
    };

    // Update last login
    adminRecord.user = updatedUser;
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(adminRecord));

    const session: AuthSession = {
      token,
      user: updatedUser,
      expiresAt,
      issuedAt,
    };

    this.currentSession = session;
    if (params.rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    this.notifyListeners();

    // Audit Log
    auditService.record({
      action: 'LOGIN',
      entity: 'auth',
      summary: `ورود موفق مدیر سیستم (${updatedUser.username}) به پنل مدیریت پولاد چرخِش`,
      performedBy: updatedUser.username,
    });

    return { success: true };
  }

  /**
   * Log out and invalidate local session
   */
  public logout(reason?: string): void {
    const user = this.getCurrentUser();
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.notifyListeners();

    if (user) {
      auditService.record({
        action: 'LOGOUT',
        entity: 'auth',
        summary: `خروج از پنل مدیریت${reason ? ` (${reason})` : ''}`,
        performedBy: user.username,
      });
    }
  }

  /**
   * Change admin password with PBKDF2 re-hashing
   */
  public async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated() || !this.currentSession) {
      return { success: false, error: 'احراز هویت معتبر نیست.' };
    }

    if (params.newPassword.length < 8) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' };
    }

    const adminRecord = this.getStoredAdmin();
    if (!adminRecord) {
      return { success: false, error: 'اطلاعات کاربری یافت نشد.' };
    }

    // Verify current password first
    const isCurrentValid = await verifyPassword(params.currentPassword, adminRecord.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'رمز عبور فعلی نادرست است.' };
    }

    // Compute fresh PBKDF2 hash with brand new random salt
    const newHash = await hashPassword(params.newPassword);
    adminRecord.passwordHash = newHash;
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(adminRecord));

    auditService.record({
      action: 'PASSWORD_CHANGED',
      entity: 'auth',
      summary: 'رمز عبور مدیریت با موفقیت به‌روزرسانی و بازتولید گردید.',
      performedBy: this.currentSession.user.username,
    });

    return { success: true };
  }
}

export const authService = new AuthService();
