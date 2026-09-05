/**
 * POLAD CHARKHESH - SECURE SERVER-AUTHENTICATED ADMIN SERVICE
 * 
 * Communicates with the Express + SQLite backend (/api/auth/*).
 * Authentication is enforced server-side using secure HttpOnly cookies,
 * constant-time PBKDF2-HMAC-SHA512 verification, server-managed sessions,
 * and rate-limiting lockout protection.
 * 
 * Zero passwords or password hashes are ever stored on the client.
 */

import { AdminUser, AuthSession } from '../types/admin';

class AuthService {
  private currentSession: AuthSession | null = null;
  private sessionListeners: Set<(session: AuthSession | null) => void> = new Set();
  private _isConfigured: boolean = true;
  private isInitializing: boolean = false;

  constructor() {
    this.cleanLegacyLocalStorage();
    this.init();
  }

  /**
   * Remove legacy client-side credentials or hashes if any existed
   */
  private cleanLegacyLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('polad_admin_credentials_v1');
      localStorage.removeItem('polad_admin_session_v1');
      localStorage.removeItem('polad_sec_signing_seed_v1');
      sessionStorage.removeItem('polad_sec_signing_seed_v1');
    } catch {}
  }

  private async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.isInitializing = true;
    try {
      await this.checkStatus();
    } catch (err) {
      console.warn('Auth status check network delay:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check backend server authentication and provisioning status
   */
  public async checkStatus(): Promise<{ isConfigured: boolean; isAuthenticated: boolean; user?: AdminUser }> {
    try {
      const res = await fetch('/api/auth/status', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        return { isConfigured: this._isConfigured, isAuthenticated: false };
      }

      const data = await res.json();
      this._isConfigured = Boolean(data.isConfigured);

      if (data.isAuthenticated && data.user) {
        this.currentSession = {
          token: 'server-session-httponly',
          user: data.user,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          issuedAt: Date.now(),
        };
        this.notifyListeners();
        return { isConfigured: this._isConfigured, isAuthenticated: true, user: data.user };
      } else {
        if (this.currentSession) {
          this.currentSession = null;
          this.notifyListeners();
        }
        return { isConfigured: this._isConfigured, isAuthenticated: false };
      }
    } catch {
      return { isConfigured: this._isConfigured, isAuthenticated: this.isAuthenticated() };
    }
  }

  /**
   * Checks whether the master administrator account has been provisioned on the server.
   */
  public isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Performs first-time initialization of master admin account on the server
   */
  public async setupInitialMasterAdmin(params: {
    username: string;
    password: string;
    name?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'خطا در ایجاد حساب کاربری ارشد' };
      }

      this._isConfigured = true;
      this.currentSession = {
        token: data.token || 'server-session-httponly',
        user: data.user,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        issuedAt: Date.now(),
      };
      this.notifyListeners();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'عدم برقراری ارتباط با سرور پایگاه داده.' };
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
   * Authenticate with backend API using PBKDF2 hash on the server
   */
  public async login(params: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ success: boolean; error?: string; remainingLockoutSeconds?: number }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'نام کاربری یا رمز عبور اشتباه است.',
          remainingLockoutSeconds: data.remainingLockoutSeconds,
        };
      }

      this.currentSession = {
        token: data.token || 'server-session-httponly',
        user: data.user,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        issuedAt: Date.now(),
      };

      this.notifyListeners();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.',
      };
    }
  }

  /**
   * Log out and invalidate session on server
   */
  public async logout(reason?: string): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout server notification warning:', e);
    } finally {
      this.currentSession = null;
      this.notifyListeners();
    }
  }

  /**
   * Change admin password through server API
   */
  public async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'خطا در تغییر رمز عبور' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'خطا در ارتباط با سرور.' };
    }
  }
}

export const authService = new AuthService();
