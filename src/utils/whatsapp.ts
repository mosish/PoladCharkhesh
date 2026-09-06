import { COMPANY_INFO, createWhatsAppInquiryUrl } from '../data/company';

export { createWhatsAppInquiryUrl };
export const DEFAULT_WHATSAPP_URL = 'https://wa.me/989127195313';

export function getSafeWhatsAppUrl(baseUrl?: string, text?: string): string {
  const base = baseUrl || COMPANY_INFO.whatsappUrl || DEFAULT_WHATSAPP_URL;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
