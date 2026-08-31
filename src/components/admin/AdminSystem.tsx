import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { AuditLog } from '../../types/admin';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService';
import { auditService } from '../../services/auditService';
import { 
  ShieldCheck, 
  KeyRound, 
  Download, 
  Upload, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  FileText, 
  Filter,
  Search,
  Trash2
} from 'lucide-react';

interface AdminSystemProps {
  language: Language;
}

export const AdminSystem: React.FC<AdminSystemProps> = ({ language }) => {
  const isFa = language === 'fa';
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Backup & Restore State
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string }>({});
  const [showResetModal, setShowResetModal] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const unsub = auditService.subscribe(setLogs);
    return () => unsub();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({});

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        success: false,
        message: isFa ? 'رمز عبور جدید و تکرار آن با یکدیگر مطابقت ندارند.' : 'New password and confirmation do not match.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({
        success: false,
        message: isFa ? 'رمز عبور باید حداقل شامل ۸ کاراکتر باشد.' : 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authService.changePassword({ currentPassword, newPassword });
      if (result.success) {
        setPasswordStatus({
          success: true,
          message: isFa ? 'رمز عبور با موفقیت تغییر یافت و با PBKDF2 هش شد.' : 'Password updated successfully and hashed with PBKDF2.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({
          success: false,
          message: result.error || (isFa ? 'رمز عبور فعلی نادرست است.' : 'Current password is incorrect.'),
        });
      }
    } catch {
      setPasswordStatus({
        success: false,
        message: isFa ? 'خطای سیستمی در تغییر رمز عبور.' : 'System error changing password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportBackup = () => {
    const snapshot = dataService.exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poladcharkhesh-master-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = dataService.importSnapshot(json, 'admin');
        if (result.success) {
          setImportStatus({
            success: true,
            message: isFa ? 'پایگاه داده با موفقیت بازیابی شد.' : 'Database snapshot restored successfully.',
          });
        } else {
          setImportStatus({
            success: false,
            message: result.error || (isFa ? 'فایل پشتیبان نامعتبر است.' : 'Invalid backup file.'),
          });
        }
      } catch (err) {
        setImportStatus({
          success: false,
          message: isFa ? 'خطا در خواندن فایل JSON.' : 'Failed to parse JSON file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    dataService.resetToCanonical('admin');
    setShowResetModal(false);
    setImportStatus({
      success: true,
      message: isFa ? 'کاتالوگ به ۶۸ محصول رسمی کاتالوگ بازگردانده شد.' : 'Reset to canonical 68 products completed.',
    });
  };

  // Filter Logs
  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return (
        log.summary.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'امنیت، گزارشات سیستمی و پشتیبان‌گیری' : 'Security, Audit Ledger & Backups'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'تغییر رمز عبور مدیر، خروجی کامل پایگاه داده، بازیابی اطلاعات و لاگ‌های امنیتی' 
              : 'Master password management, complete JSON snapshot backup/restore, and immutable audit logs'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Password & Backup Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Change Password Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'تغییر رمز عبور مدیر سامانه' : 'Change Master Password'}</span>
            </h3>

            {passwordStatus.message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordStatus.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {passwordStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'رمز عبور فعلی:' : 'Current Password:'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'رمز عبور جدید (حداقل ۸ کاراکتر):' : 'New Password (min 8 chars):'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'تکرار رمز عبور جدید:' : 'Confirm New Password:'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                {isChangingPassword 
                  ? (isFa ? 'در حال محاسبه هش...' : 'Hashing...') 
                  : (isFa ? 'ثبت و هش رمز جدید (PBKDF2)' : 'Update & Hash Password')}
              </button>
            </form>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'پشتیبان‌گیری و بازیابی پایگاه داده' : 'Dataset Backup & Restore'}</span>
            </h3>

            {importStatus.message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="space-y-2.5">
              
              {/* Export JSON Button */}
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-bold text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
                  <span>{isFa ? 'دانلود نسخه پشتیبان کامل (JSON)' : 'Download Snapshot (.JSON)'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">68+ items</span>
              </button>

              {/* Import File Input */}
              <label className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{isFa ? 'بازیابی از فایل پشتیبان JSON' : 'Restore from JSON File'}</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              {/* Factory Reset Button */}
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>{isFa ? 'بازنشانی کاتالوگ به ۶۸ محصول اصلی' : 'Reset to Canonical 68 Products'}</span>
                </div>
              </button>

            </div>
          </div>

        </div>

        {/* Right Column: Full Audit Trail Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'دفتر ثبت رویدادهای امنیتی و تغییرات' : 'Activity & Audit Trail'}</span>
              </h3>

              <div className="flex items-center gap-2">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                >
                  <option value="ALL">{isFa ? 'همه رویدادها' : 'All Actions'}</option>
                  <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
                  <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
                  <option value="PRODUCT_DELETE">PRODUCT_DELETE</option>
                  <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                  <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
                  <option value="COMPANY_UPDATE">COMPANY_UPDATE</option>
                  <option value="CONTENT_UPDATE">CONTENT_UPDATE</option>
                  <option value="SEO_UPDATE">SEO_UPDATE</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${isFa ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder={isFa ? 'جستجو در گزارشات...' : 'Search logs...'}
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl py-1.5 text-xs text-white placeholder-slate-500 font-mono ${isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              />
            </div>

            {/* Logs List */}
            <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {isFa ? 'رویدادی ثبت نشده است.' : 'No audit records match the filter.'}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="py-3 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        user: {log.performedBy}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium text-[11px] leading-relaxed">
                      {log.summary}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={isFa ? 'rtl' : 'ltr'}>
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center">
              {isFa ? 'تأیید بازنشانی کاتالوگ' : 'Confirm Factory Reset'}
            </h3>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              {isFa 
                ? 'آیا اطمینان دارید که می‌خواهید تمامی تغییرات اعمال‌شده بر محصولات را لغو و کاتالوگ را دقیقاً به ۶۸ محصول پایه و رسمی کارخانه بازنشانی کنید؟' 
                : 'Are you sure you want to reset all products back to the canonical 68 items?'}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleFactoryReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                {isFa ? 'بله، بازنشانی کن' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
