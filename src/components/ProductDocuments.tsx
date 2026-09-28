import React from 'react';
import type { BearingProduct, Language } from '../types';
import { isSafeAssetUrl } from '../utils/contentModel';
export function ProductDocuments({ product, language }: { product: BearingProduct; language: Language }) {
  if (!product.pdfUrl || !isSafeAssetUrl(product.pdfUrl)) return null;
  return <a className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 mt-3 text-sm font-semibold text-[#232c86]"
    href={product.pdfUrl} target="_blank" rel="noopener noreferrer">
    {language === 'fa' ? 'دریافت PDF پیوست محصول' : 'Download attached product PDF'} ↗
  </a>;
}
