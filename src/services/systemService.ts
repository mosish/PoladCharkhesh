/**
 * POLAD CHARKHESH - SYSTEM & AUDIT SERVICE
 * 
 * Communicates with backend /api/system/* endpoints.
 * Provides access to audit trail browser, backup export, restore,
 * factory reset, and system health status.
 */

import { AuditLog, DatasetSnapshot, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export interface AuditLogsResponse {
  logs: AuditLog[];
}

export const systemService = {
  /**
   * Fetch audit trail logs with optional filtering.
   */
  async getAuditLogs(filters?: { limit?: number; entity?: string; action?: string }): Promise<ApiResponse<AuditLogsResponse>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.entity) params.set('entity', filters.entity);
    if (filters?.action) params.set('action', filters.action);

    const qs = params.toString();
    const url = qs ? `/api/system/audit-logs?${qs}` : '/api/system/audit-logs';
    return apiClient.get<AuditLogsResponse>(url);
  },

  /**
   * Export full system snapshot JSON.
   */
  async exportBackup(): Promise<ApiResponse<DatasetSnapshot>> {
    return apiClient.get<DatasetSnapshot>('/api/system/backup');
  },

  /**
   * Restore system from JSON snapshot (Superadmin only).
   */
  async restoreBackup(snapshot: unknown): Promise<ApiResponse<{ success: boolean; message: string; restoredProductsCount: number }>> {
    return apiClient.post<{ success: boolean; message: string; restoredProductsCount: number }>('/api/system/restore', snapshot);
  },

  /**
   * Perform factory reset to the 68 canonical catalog products (Superadmin only).
   */
  async factoryReset(credentials: { username: string; password: string }): Promise<ApiResponse<{ success: boolean; message: string; productsRestored: number }>> {
    return apiClient.post<{ success: boolean; message: string; productsRestored: number }>('/api/system/factory-reset', credentials);
  },

  /**
   * Check backend health.
   */
  async checkHealth(): Promise<ApiResponse<{ status: string; service: string; timestamp: string }>> {
    return apiClient.get<{ status: string; service: string; timestamp: string }>('/api/health');
  },
};
