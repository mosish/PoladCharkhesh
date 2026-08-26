import React from 'react';
import { Layers, Activity, RotateCw, X, FileDown, MessageCircle, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface SkeletonProps {
  className?: string;
}

/** Shimmering pulse bar */
export const SkeletonBar: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-slate-200/70 rounded-xl animate-pulse ${className}`} />
);

/** Shimmering pulse box with Apple liquid glass styling */
export const SkeletonBox: React.FC<SkeletonProps> = ({ className = 'h-24 w-full' }) => (
  <div className={`bg-slate-200/60 rounded-2xl animate-pulse border border-white/60 ${className}`} />
);

/** Product Catalog Card Skeleton */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-3xl flex flex-col justify-between p-5 sm:p-6 space-y-4 border border-white/80 animate-shimmer">
      <div>
        {/* Top Code & Status Badge Skeleton */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="space-y-2 flex-1">
            <div className="h-6 w-24 bg-blue-200/50 rounded-lg animate-pulse" />
            <div className="h-4 w-44 bg-slate-200/80 rounded-lg animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-emerald-100/60 rounded-full animate-pulse shrink-0" />
        </div>

        {/* Media / Schematic Box Skeleton */}
        <div className="my-3 h-36 sm:h-40 rounded-2xl bg-slate-100/80 border border-white/90 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300/70 animate-[spin_8s_linear_infinite]" />
          <div className="mt-3 h-3 w-28 bg-slate-200 rounded-md animate-pulse" />
        </div>

        {/* 3-Metric Dimensions Callout Skeleton */}
        <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-100/60 rounded-2xl border border-white/80 mb-3 text-center">
          <div className="space-y-1 p-1">
            <div className="h-2.5 w-10 bg-slate-200 rounded mx-auto animate-pulse" />
            <div className="h-4 w-14 bg-slate-300/80 rounded mx-auto animate-pulse" />
          </div>
          <div className="space-y-1 p-1">
            <div className="h-2.5 w-10 bg-slate-200 rounded mx-auto animate-pulse" />
            <div className="h-4 w-14 bg-slate-300/80 rounded mx-auto animate-pulse" />
          </div>
          <div className="space-y-1 p-1">
            <div className="h-2.5 w-10 bg-slate-200 rounded mx-auto animate-pulse" />
            <div className="h-4 w-14 bg-slate-300/80 rounded mx-auto animate-pulse" />
          </div>
        </div>

        {/* Specs List Skeleton */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-3.5 w-16 bg-blue-200/60 rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Product Catalog Table Skeleton */
export const ProductTableSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto shadow-sm animate-shimmer">
      <table className="w-full text-start text-xs">
        <thead className="bg-slate-100/80 backdrop-blur-md text-slate-500 font-bold border-b border-slate-200/60">
          <tr>
            <th className="py-3.5 px-4 text-start">کد فنی / Part Code</th>
            <th className="py-3.5 px-4 text-start">دسته‌بندی / Type</th>
            <th className="py-3.5 px-4 text-start">ابعاد / Dimensions</th>
            <th className="py-3.5 px-4 text-start">بار دینامیک (Cr)</th>
            <th className="py-3.5 px-4 text-start">بار استاتیک (Cor)</th>
            <th className="py-3.5 px-4 text-start">حداکثر دور (RPM)</th>
            <th className="py-3.5 px-4 text-start">برندها / Brands</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/40">
          {Array.from({ length: count }).map((_, idx) => (
            <tr key={idx} className="bg-white/40">
              <td className="py-4 px-4">
                <div className="h-4 w-20 bg-blue-200/60 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="h-4 w-36 bg-slate-200/80 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="h-4 w-28 bg-slate-200/70 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="h-4 w-16 bg-blue-100 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="h-4 w-16 bg-slate-200/70 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="h-4 w-20 bg-sky-100 rounded-md animate-pulse" />
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-1.5">
                  <div className="h-4 w-10 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-slate-200 rounded animate-pulse" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Bearing Specification Modal Skeleton */
export const BearingSpecModalSkeleton: React.FC<{
  language: Language;
  onClose: () => void;
}> = ({ language, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="bearing-spec-modal-skeleton-card"
        className="relative w-full max-w-4xl max-h-[92vh] glass-card rounded-3xl shadow-2xl overflow-y-auto bg-white/95 flex flex-col animate-shimmer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Skeleton Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/15">
              <RotateCw className="w-5 h-5 animate-[spin_3s_linear_infinite]" />
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-32 bg-blue-200/60 rounded-lg animate-pulse" />
                <div className="h-5 w-24 bg-emerald-100 rounded-full animate-pulse" />
              </div>
              <div className="h-3.5 w-48 bg-slate-200/80 rounded animate-pulse" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skeleton Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Top Grid: CAD / Photo Box & Metric Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 flex flex-col justify-center">
              <div className="h-56 sm:h-64 rounded-3xl bg-slate-100/80 border border-slate-200/80 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-blue-300 animate-[spin_10s_linear_infinite]" />
                <div className="mt-4 h-3.5 w-36 bg-slate-200 rounded-md animate-pulse" />
                <div className="mt-2 h-2.5 w-24 bg-slate-200/70 rounded-md animate-pulse" />
              </div>
              <div className="mt-2.5 h-3 w-40 bg-slate-200/70 rounded mx-auto animate-pulse" />
            </div>

            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#232c86]" />
                  <div className="h-4 w-32 bg-slate-200/90 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-6 w-16 bg-slate-300 rounded mx-auto animate-pulse" />
                  </div>
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-6 w-16 bg-slate-300 rounded mx-auto animate-pulse" />
                  </div>
                  <div className="p-3 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-6 w-16 bg-slate-300 rounded mx-auto animate-pulse" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#232c86]" />
                  <div className="h-4 w-36 bg-slate-200/90 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-14 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-5 w-20 bg-blue-200/80 rounded mx-auto animate-pulse" />
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-14 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-5 w-20 bg-blue-200/80 rounded mx-auto animate-pulse" />
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-16 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-5 w-20 bg-sky-200/80 rounded mx-auto animate-pulse" />
                  </div>
                  <div className="p-2.5 bg-slate-100/60 rounded-2xl border border-white/80 space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-5 w-16 bg-slate-300 rounded mx-auto animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Materials & Features Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100/60 rounded-2xl border border-white/80 space-y-3">
              <div className="h-3.5 w-32 bg-slate-300 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-slate-200/80 rounded animate-pulse" />
                <div className="h-3.5 w-5/6 bg-slate-200/80 rounded animate-pulse" />
                <div className="h-3.5 w-4/6 bg-slate-200/80 rounded animate-pulse" />
              </div>
            </div>

            <div className="p-4 bg-slate-100/60 rounded-2xl border border-white/80 space-y-3">
              <div className="h-3.5 w-28 bg-slate-300 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-14 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-6 w-14 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-6 w-14 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-6 w-14 bg-slate-200 rounded-xl animate-pulse" />
              </div>
              <div className="h-3 w-full bg-slate-200/70 rounded animate-pulse" />
            </div>
          </div>

          {/* Applications Chips Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-300 rounded animate-pulse" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-32 bg-blue-100/70 rounded-full animate-pulse" />
              <div className="h-7 w-40 bg-blue-100/70 rounded-full animate-pulse" />
              <div className="h-7 w-36 bg-blue-100/70 rounded-full animate-pulse" />
              <div className="h-7 w-28 bg-blue-100/70 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Footer */}
        <div className="sticky bottom-0 z-20 px-5 sm:px-6 py-4 bg-slate-50/95 backdrop-blur-md border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="h-10 w-44 bg-blue-200/70 rounded-2xl animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-36 bg-emerald-200/70 rounded-2xl animate-pulse" />
            <div className="h-10 w-28 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
