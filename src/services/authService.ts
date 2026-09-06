/**
 * POLAD CHARKHESH - SECURE SERVER-AUTHENTICATED ADMIN SERVICE
 * 
 * Communicates with the Express + SQLite backend (/api/auth/*).
 * Authentication is enforced server-side using secure HttpOnly cookies,
 * constant-time PBKDF2-HMAC-SHA512 verification, server-managed sessions,
 * and rate-limiting lockout protection.
 * 
 * CRITICAL SECURITY INVARIANT:
 * Zero passwords, password hashes, or session tokens are stored on the client.
 */

import { AdminUser, AuthSession, AdminUserState, ApiResponse } from '../types/admin';
import { apiClient, registerSessionExpiredHandler } from './apiClient';

class AuthService {
  private userState: AdminUserState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    isSessionExpired: false,
  };

  private currentSession: AuthSession | null = null;
  private listeners: Set<(state: AdminUserState) => void> = new Set();
  private legacySessionListeners: Set<(session: AuthSession | null) => void> = new Set();
  private _isConfigured: boolean = true;

  constructor() {
    this.cleanLegacyLocalStorage();
    registerSessionExpiredHandler(() => this.handleSessionExpired());
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
    try {
      await this.checkStatus();
    } catch (err) {
      console.warn('Auth status check network delay:', err);
    } finally {
      this.userState.isLoading = false;
      this.notifyListeners();
    }
  }

  public handleSessionExpired(): void {
    if (this.userState.isAuthenticated) {
      this.userState = {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isSessionExpired: true,
      };
      this.currentSession = null;
      this.notifyListeners();
    }
  }

  /**
   * Check backend server authentication and provisioning status
   */
  public async checkStatus(): Promise<AdminUserState> {
    const res = await apiClient.get<{ isConfigured: boolean; isAuthenticated: boolean; user?: AdminUser }>('/api/auth/status');

    if (res.success && res.data) {
      this._isConfigured = Boolean(res.data.isConfigured);

      if (res.data.isAuthenticated && res.data.user) {
        this.userState = {
          isAuthenticated: true,
          user: res.data.user,
          isLoading: false,
          isSessionExpired: false,
        };
        this.currentSession = {
          user: res.data.user,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          issuedAt: Date.now(),
        };
      } else {
        this.userState = {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isSessionExpired: false,
        };
        this.currentSession = null;
      }
    } else {
      this.userState.isLoading = false;
    }

    this.notifyListeners();
    return { ...this.userState };
  }

  public isConfigured(): boolean {
    return this._isConfigured;
  }

  public getState(): AdminUserState {
    return { ...this.userState };
  }

  public isAuthenticated(): boolean {
    return this.userState.isAuthenticated;
  }

  public getCurrentUser(): AdminUser | null {
    return this.userState.user;
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  public isSessionExpired(): boolean {
    return this.userState.isSessionExpired;
  }

  /**
   * Performs first-time initialization of master admin account on the server
   */
  public async setupInitialMasterAdmin(params: {
    username: string;
    password: string;
    name?: string;
    email?: string;
  }): Promise<ApiResponse<{ user: AdminUser }>> {
    const res = await apiClient.post<{ success: boolean; user: AdminUser }>('/api/auth/setup', params);

    if (res.success && res.data?.user) {
      this._isConfigured = true;
      this.userState = {
        isAuthenticated: true,
        user: res.data.user,
        isLoading: false,
        isSessionExpired: false,
      };
      this.currentSession = {
        user: res.data.user,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        issuedAt: Date.now(),
      };
      this.notifyListeners();
      return { success: true, data: { user: res.data.user } };
    }

    return {
      success: false,
      error: !res.success ? res.error : { code: 'SETUP_FAILED', message: 'خطا در ایجاد حساب کاربری ارشد' },
    };
  }

  /**
   * Authenticate with backend API using PBKDF2 hash on the server
   */
  public async login(params: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<ApiResponse<{ user: AdminUser }>> {
    const res = await apiClient.post<{ success: boolean; user: AdminUser; remainingLockoutSeconds?: number }>('/api/auth/login', params);

    if (res.success && res.data?.user) {
      this.userState = {
        isAuthenticated: true,
        user: res.data.user,
        isLoading: false,
        isSessionExpired: false,
      };
      this.currentSession = {
        user: res.data.user,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        issuedAt: Date.now(),
      };
      this.notifyListeners();
      return { success: true, data: { user: res.data.user } };
    }

    return {
      success: false,
      error: !res.success ? res.error : { code: 'AUTH_FAILED', message: 'نام کاربری یا رمز عبور اشتباه است.' },
    };
  }

  /**
   * Log out and invalidate session on server
   */
  public async logout(reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    const res = await apiClient.post<{ success: boolean }>('/api/auth/logout', { reason });

    this.userState = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      isSessionExpired: false,
    };
    this.currentSession = null;
    this.notifyListeners();

    return res;
  }

  /**
   * Change admin password through server API
   */
  public async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>('/api/auth/change-password', params);
  }

  private notifyListeners(): void {
    const stateCopy = { ...this.userState };
    const sessionCopy = this.currentSession ? { ...this.currentSession } : null;
    this.listeners.forEach((listener) => listener(stateCopy));
    this.legacySessionListeners.forEach((listener) => listener(sessionCopy));
  }

  public subscribe(listener: (state: AdminUserState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.userState });
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Backward-compatible subscription for components expecting AuthSession | null
   */
  public subscribeLegacy(listener: (session: AuthSession | null) => void): () => void {
    this.legacySessionListeners.add(listener);
    listener(this.currentSession ? { ...this.currentSession } : null);
    return () => {
      this.legacySessionListeners.delete(listener);
    };
  }
}

export const authService = new AuthService();
