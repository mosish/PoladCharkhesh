import { translations } from '../data/translations';
import { usePageContent } from './dataService';
import { DEFAULT_COPY } from '../data/siteCopy';
import type { Language } from '../types';

function localize(value: any, language: Language): any {
  if (Array.isArray(value)) return value.map(item => localize(item, language));
  if (value && typeof value === 'object') {
    if ('fa' in value && 'en' in value) return value[language];
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, language)]));
  }
  return value;
}
export function useSiteCopy(language: Language): typeof translations.fa {
  const content = usePageContent();
  const copy = content.copy ?? DEFAULT_COPY;
  const base = translations[language];
  const result = { ...base };
  for (const key of Object.keys(base)) {
    if (key in copy) (result as any)[key] = { ...(base as any)[key], ...localize((copy as any)[key], language) };
  }
  return result;
}
