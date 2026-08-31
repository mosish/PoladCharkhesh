/**
 * POLAD CHARKHESH - AUDIT LOG SERVICE
 * 
 * Provides an immutable activity ledger for tracking administrative actions:
 * - User logins / logouts / failed attempts
 * - Product creation, updates, archival, and deletions
 * - Company data modifications
 * - Page content (CMS) and SEO configuration changes
 * - Backup export / import and system resets
 */

import { AuditAction, AuditEntity, AuditLog } from '../types/admin';

const AUDIT_STORAGE_KEY = 'polad_admin_audit_logs_v1';
const MAX_AUDIT_LOGS = 250;

class AuditService {
  private logs: AuditLog[] = [];
  private listeners: Set<(logs: AuditLog[]) => void> = new Set();

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load audit logs from storage:', e);
    }
    
    // Default initial seed log
    this.logs = [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_RESET',
        entity: 'system',
        summary: 'Admin audit engine initialized with canonical data architecture.',
        performedBy: 'system',
      },
    ];
  }

  private saveLogs(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save audit logs:', e);
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

    if (this.logs.length > MAX_AUDIT_LOGS) {
      this.logs = this.logs.slice(0, MAX_AUDIT_LOGS);
    }

    this.saveLogs();
    return newLog;
  }

  public subscribe(listener: (logs: AuditLog[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clearLogs(performedBy: string): void {
    this.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_RESET',
        entity: 'system',
        summary: 'Audit logs cleared by administrator.',
        performedBy,
      },
    ];
    this.saveLogs();
  }
}

export const auditService = new AuditService();
