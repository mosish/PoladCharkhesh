import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { AdminProductItem, AuditLog } from '../../types/admin';
import { dataService } from '../../services/dataService';
import { auditService } from '../../services/auditService';
import { validateProductDataset } from '../../utils/productValidation';
import { 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Download, 
  Building2, 
  Layers, 
  Clock, 
  FileCheck2,
  TrendingUp
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

interface AdminOverviewProps {
  language: Language;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAddProductModal: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  language,
  onNavigateTab,
  onOpenAddProductModal,
}) => {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsubProducts = dataService.subscribeToProducts(setProducts);
    const unsubLogs = auditService.subscribe(setAuditLogs);
    return () => {
      unsubProducts();
      unsubLogs();
    };
  }, []);

  const isFa = language === 'fa';

  // Statistics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => !p.isArchived).length;
  const archivedProducts = products.filter((p) => p.isArchived).length;
  const verifiedFactorsCount = products.filter((p) => 
    p.calculationFactorE !== undefined || p.calculationFactorY !== undefined || p.calculationFactorF0 !== undefined
  ).length;

  const uniqueBrands = Array.from(
    new Set(products.flatMap((p) => p.brands || []))
  );

  // Integrity Report
  const integrityReport = validateProductDataset(products);

  const handleExportBackup = () => {
    const snapshot = dataService.exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poladcharkhesh-dataset-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>{isFa ? 'داشبورد کنترل و سلامت پایگاه داده' : 'System Overview & Database Health'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFa 
              ? 'نمای کلی کاتالوگ، شاخص‌های مهندسی ISO 281 و فعالیت‌های مدیریتی' 
              : 'Summary of catalog items, ISO 281 engineering indices, and activity logs'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenAddProductModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#232c86] to-indigo-600 hover:from-[#1b236d] hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'افزودن محصول جدید' : 'Add New Product'}</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{isFa ? 'پشتیبان‌گیری JSON' : 'Export Backup'}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Products */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">{isFa ? 'کل اقلام کاتالوگ' : 'Total Catalog Items'}</span>
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {totalProducts}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ({activeProducts} {isFa ? 'فعال' : 'Active'})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {archivedProducts > 0 
              ? `${archivedProducts} ${isFa ? 'قلم بایگانی‌شده' : 'Archived'}` 
              : (isFa ? 'همه اقلام در وب‌سایت فعال هستند' : 'All items public')}
          </div>
        </div>

        {/* Card 2: ISO Factor Verified */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">{isFa ? 'ضرایب تأییدشده ISO 281' : 'Verified ISO Factors'}</span>
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {verifiedFactorsCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {totalProducts}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {isFa ? 'دارای ضرایب رسمی کاتالوگ (e, Y, f₀)' : 'Catalog-verified engineering factors'}
          </div>
        </div>

        {/* Card 3: Supported Brands */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">{isFa ? 'تنوع برندهای معتبر' : 'Supported Brands'}</span>
            <Building2 className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {uniqueBrands.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">{isFa ? 'برند بین‌المللی' : 'Brands'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            SKF, FAG, TIMKEN, NSK, NTN...
          </div>
        </div>

        {/* Card 4: Audit Logs Count */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">{isFa ? 'رویدادهای ثبت‌شده' : 'Recorded Logs'}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {auditLogs.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">{isFa ? 'گزارش امنیتی' : 'Audit records'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {isFa ? 'ردیابی تغییرات با فرمت استاندارد' : 'Continuous activity ledger'}
          </div>
        </div>

      </div>

      {/* Dataset Integrity Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-4 ${
        integrityReport.isValid 
          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
          : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
      }`}>
        {integrityReport.isValid ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">
              {isFa ? 'وضعیت یکپارچگی داده‌های کاتالوگ (Dataset Integrity)' : 'Dataset Integrity Health Check'}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              integrityReport.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {integrityReport.isValid ? '100% HEALTHY' : 'NEEDS ATTENTION'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {integrityReport.isValid
              ? (isFa 
                  ? `تمام ${integrityReport.totalChecked} قطعه دارای شناسه‌های یکتا، مقادیر ابعادی معتبر (d, D, B)، بارهای نامی مثبت (Cr, C0r) و ساختار بدون تکرار می‌باشند.` 
                  : `All ${integrityReport.totalChecked} items pass strict sanity checks: unique IDs, non-negative loads, and verified dimensions.`)
              : (isFa 
                  ? `خطاهایی در داده‌ها شناسایی شد: تکراری‌ها=${integrityReport.duplicateCodes.length}، فیلدهای ناقص=${integrityReport.missingRequiredFields.length}` 
                  : `Integrity issues detected: Duplicate codes=${integrityReport.duplicateCodes.length}, Missing fields=${integrityReport.missingRequiredFields.length}`)}
          </p>
        </div>
      </div>

      {/* 2-Column: Quick Modules Navigation + Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Module Access */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 px-1">
            {isFa ? 'دسترسی سریع به ماژول‌های مدیریتی' : 'Quick Navigation'}
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => onNavigateTab('products')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-start group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFa ? 'مدیریت محصولات و ابعاد' : 'Manage Products & Specs'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? 'ویرایش ابعاد، ظرفیت بار و ضرایب' : 'Edit dimensions, load ratings & ISO factors'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-400 font-bold">{totalProducts}</span>
            </button>

            <button
              onClick={() => onNavigateTab('company')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-start group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFa ? 'اطلاعات و تماس شرکت' : 'Company & Contact Info'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? 'شماره‌های تماس، آدرس فیزیکی و ساعات کاری' : 'Phones, WhatsApp, address, working hours'}
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('content')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-start group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFa ? 'محتوای متنی صفحات (CMS)' : 'Page Content (CMS)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? 'متن‌های هیرو، درباره ما، فوتر و نشان‌ها' : 'Hero headline, About text, footer copy'}
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('system')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-start group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFa ? 'امنیت و گزارشات سیستمی' : 'Security & Audit Logs'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? 'تغییر رمز عبور، لاگ فعالیت‌ها و بک‌آپ' : 'Change password, logs, dataset backups'}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Recent Activity Stream */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-300">
              {isFa ? 'آخرین رویدادهای ثبت‌شده در لاگ' : 'Recent Audit Logs'}
            </h3>
            <button
              onClick={() => onNavigateTab('system')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isFa ? 'مشاهده تمام لاگ‌ها' : 'View All Logs'}
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">{log.summary}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {log.performedBy}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
