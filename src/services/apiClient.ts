/**
 * POLAD CHARKHESH - CENTRALIZED API CLIENT
 * 
 * Standardized HTTP communication layer ensuring:
 * - Credentials included on all requests (HttpOnly session cookies)
 * - Safe response normalization conforming to ApiResponse<T>
 * - Consistent error parsing and reporting
 * - Session expiration hook
 * - Zero token leakage or exposure
 */

import { ApiResponse, ApiErrorDetail } from '../types/admin';

export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(code: string, message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type SessionExpiredHandler = () => void;
let onSessionExpiredCallback: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpiredCallback = handler;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // Mandated for HttpOnly secure cookie authentication
    });

    // Handle session expiration
    if (res.status === 401) {
      if (onSessionExpiredCallback && !endpoint.includes('/api/auth/status')) {
        onSessionExpiredCallback();
      }
    }

    let payload: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
    }

    if (!res.ok) {
      const errorCode = payload?.code || `HTTP_${res.status}`;
      const errorMessage = payload?.error || payload?.message || `درخواست با خطای سرور (${res.status}) مواجه گردید.`;
      
      const errorDetail: ApiErrorDetail = {
        code: errorCode,
        message: String(errorMessage),
        details: payload?.details,
      };

      return {
        success: false,
        error: errorDetail,
      };
    }

    // Success response unwrapping
    // If backend returns { success: true, data: ... }, or direct objects like { count, products }, normalize into data
    const data = (payload && typeof payload === 'object' && 'data' in payload && payload.success === true)
      ? payload.data
      : payload;

    return {
      success: true,
      data: data as T,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.',
      },
    };
  }
}

export const apiClient = {
  get: <T>(url: string, headers?: Record<string, string>) => 
    apiRequest<T>(url, { method: 'GET', headers }),
    
  post: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
    
  put: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
    
  patch: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
    
  delete: <T>(url: string, headers?: Record<string, string>) =>
    apiRequest<T>(url, { method: 'DELETE', headers }),
};
