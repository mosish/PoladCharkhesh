import type { Language } from '../types';

// Public canonical origins are intentional: preview hosts and localhost never enter SEO.
export const SITE_ORIGINS: Record<Language, string> = {
  fa: 'https://poladcharkhesh.ir',
  en: 'https://poladcharkhesh.com',
};

export function resolveInitialLanguage(hostname: string, preference: string | null): Language {
  if (preference === 'fa' || preference === 'en') return preference;
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return host === 'poladcharkhesh.com' ? 'en' : 'fa';
}
