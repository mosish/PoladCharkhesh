import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Language } from '../types';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  language: Language;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, language, className = '' }) => {
  const isRtl = language === 'fa';
  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 font-medium ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.isCurrent;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              {index === 0 && (
                <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-bold text-slate-900 font-mono-spec px-1.5 py-0.5 rounded bg-blue-50/80 text-blue-950 border border-blue-100/60"
                >
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-blue-700 hover:underline transition-colors cursor-pointer text-slate-600 truncate max-w-[180px]"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="hover:text-blue-700 hover:underline transition-colors text-slate-600 truncate max-w-[180px]"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-slate-600 truncate max-w-[180px]">{item.label}</span>
              )}

              {!isLast && (
                <SeparatorIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
