/**
 * POLAD CHARKHESH - AUDIT LOG SERVICE
 * 
 * Provides an authoritative activity ledger for tracking administrative actions.
 * Fetches server-persisted audit entries from SQLite via /api/system/audit-logs.
 */

import { AuditAction, AuditEntity, AuditLog } from '../types/admin';

class AuditService {
  private logs: AuditLog[] = [];
  private listeners: Set<(logs: AuditLog[]) => void> = new Set();

  constructor() {
    this.cleanLegacyLocalStorage();
    this.refreshFromServer();
  }

  private cleanLegacyLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('polad_admin_audit_logs_v1');
    } catch {}
  }

  public async refreshFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/system/audit-logs?limit=200', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          this.logs = data.logs;
          this.notifyListeners();
        }
      }
    } catch (e) {
      // Offline or unauthenticated fallback
    }
  }

  private notifyListeners(): void {
    const copy = [...this.logs];
    this.listeners.forEach((listener) => listener(copy));
  }

  public getLogs(): AuditLog[] {
    return [...this.logs];
  }

  public record(params: {
    action: AuditAction;
    entity: AuditEntity;
    summary: string;
    entityId?: string;
    details?: Record<string, any>;
    performedBy?: string;
  }): AuditLog {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      summary: params.summary,
      details: params.details,
      performedBy: params.performedBy || 'admin',
    };

    this.logs.unshift(newLog);
    this.notifyListeners();
    return newLog;
  }

  public subscribe(listener: (logs: AuditLog[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const auditService = new AuditService();
