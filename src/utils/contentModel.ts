// Plain text content only. Product dimensions, formulas and standard tables never enter this model.
export function mergeContent<T>(base: T, patch: unknown): T {
  if (patch === undefined) return structuredClone(base);
  if (Array.isArray(base)) return structuredClone(patch) as T;
  if (base && typeof base === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(base)) {
      result[key] = mergeContent((base as any)[key], (patch as any)?.[key]);
    }
    return result as T;
  }
  return patch as T;
}

export function validateContentShape(value: unknown, template: unknown, path = 'content'): string[] {
  if (typeof template === 'string') {
    if (typeof value !== 'string' || value.length > 5000) return [path + ': expected text (maximum 5000 characters)'];
    if (/(?:image|url)$/i.test(path) && value && !isSafeAssetUrl(value)) return [path + ': use a local path or HTTPS URL'];
    if (/\.phone$/.test(path) && value && !/^[+0-9 ()-]{5,30}$/.test(value)) return [path + ': invalid phone number'];
    return [];
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > 50) return [path + ': maximum 50 items'];
    return value.flatMap((item, i) => {
      const shape = template[0];
      if (shape && typeof shape === 'object' && !Array.isArray(shape) &&
        (!item || typeof item !== 'object' || Object.keys(shape).some(key => !Object.prototype.hasOwnProperty.call(item, key)))) {
        return [path + '.' + i + ': missing item fields'];
      }
      return validateContentShape(item, shape, path + '.' + i);
    });
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [path + ': expected an object'];
  return Object.entries(value).flatMap(([key, item]) => {
    if (!Object.prototype.hasOwnProperty.call(template, key)) return [path + '.' + key + ': unknown field'];
    return validateContentShape(item, (template as any)[key], path + '.' + key);
  });
}

export function isSafeAssetUrl(value: string): boolean {
  if (!value || value.length > 2048 || /[\\\s<>\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return !value.split('/').includes('..');
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}
