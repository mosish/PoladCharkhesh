/** Keep local upload identity unambiguous for reference checks and deletion. */
export function isSafeAssetUrl(value: unknown, allowEmpty = true): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  if (!value) return allowEmpty;
  if (value !== value.trim() || /[\s\\\x00-\x1f]/.test(value)) return false;
  if (value.startsWith('/')) {
    if (value.startsWith('//') || /%(?:2e|2f|5c|25)/i.test(value)) return false;
    if (value.split(/[/?#]/).some(part => part === '.' || part === '..')) return false;
    if (value.startsWith('/uploads/') && !/^\/uploads\/[a-zA-Z0-9._-]+$/.test(value)) return false;
    return true;
  }
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}

export function assetIdentity(value: string): string {
  if (!value.startsWith('/')) return value;
  try { return decodeURIComponent(new URL(value, 'https://local.invalid').pathname); }
  catch { return value; }
}
