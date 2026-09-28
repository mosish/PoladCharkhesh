import { validateCompanyPayload, validateContentPayload, validateInquiryPayload, validateMediaPayload, validateProductCandidate, validateSeoPayload, containsForbiddenKeys } from './validation';

/** Validate all domains before beginning a destructive restore transaction. */
export function validateSnapshot(snapshot: any): string[] {
  const errors: string[] = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || containsForbiddenKeys(snapshot)) return ['Invalid backup object'];
  const list = (name: string, values: any, validate: (value: any) => { isValid: boolean; errors: string[] }, keys: string[]) => {
    if (!Array.isArray(values) || values.length > 10000) { errors.push(`Invalid ${name} list`); return; }
    const seen = keys.map(() => new Set<string>());
    for (const item of values) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) { errors.push(`Invalid ${name} item`); continue; }
      const result = validate(item);
      if (!result.isValid) errors.push(`${name}: ${result.errors.join(', ')}`);
      keys.forEach((key, i) => {
        const value = item[key];
        if (typeof value !== 'string' || !value.trim() || value.length > 2000 || seen[i].has(value.toLowerCase())) errors.push(`${name}: missing or duplicate ${key}`);
        else seen[i].add(value.toLowerCase());
      });
    }
  };
  list('products', snapshot.products, validateProductCandidate, ['id', 'code', 'slug']);
  if (!snapshot.products?.length) errors.push('Empty products');
  for (const [key, validator] of Object.entries({ companyInfo: validateCompanyPayload, pageContent: validateContentPayload, seoConfig: validateSeoPayload })) {
    if (snapshot[key] !== undefined) {
      const result = validator(snapshot[key]);
      if (!result.isValid) errors.push(`${key}: ${result.errors.join(', ')}`);
      else snapshot[key] = result.sanitized;
    }
  }
  if (snapshot.media !== undefined) {
    list('media', snapshot.media, validateMediaPayload, ['id', 'url']);
    for (const item of Array.isArray(snapshot.media) ? snapshot.media : []) {
      if (!item || ['filename','originalName','mimeType','createdAt'].some(k => typeof item[k] !== 'string' || !item[k])) errors.push('Invalid media identity');
    }
  }
  if (snapshot.inquiries !== undefined) {
    list('inquiries', snapshot.inquiries, validateInquiryPayload, ['id']);
    for (const item of Array.isArray(snapshot.inquiries) ? snapshot.inquiries : []) {
      if (!item || typeof item.timestamp !== 'string' || !Number.isFinite(Date.parse(item.timestamp)) || !['new','reviewed','contacted','closed'].includes(item.status) || ['fullName','phone','message'].some(k => typeof item[k] !== 'string')) errors.push('Invalid inquiry record');
    }
  }
  return errors;
}
