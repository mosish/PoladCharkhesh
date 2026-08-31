/**
 * POLAD CHARKHESH - SECURITY & INPUT SANITIZATION UTILITIES
 * 
 * Provides defense-in-depth protection against:
 * 1. Stored & Reflected Cross-Site Scripting (XSS)
 * 2. Malicious URI schemes (javascript:, vbscript:, data:text/html)
 * 3. Prototype Pollution attacks during JSON backup imports
 * 4. Dangerous tag and attribute injection
 */

/**
 * Sanitizes URLs to prevent javascript: or malicious protocol execution.
 * Only allows https, http, mailto, tel, relative paths, or safe data:image URIs.
 */
export function sanitizeUrl(url: string | undefined | null, fallback: string = ''): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const clean = url.trim();
  if (!clean) return fallback;

  // Block dangerous protocols and control characters
  const lower = clean.toLowerCase().replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/')
  ) {
    console.warn('[Security] Blocked malicious URL scheme:', clean);
    return fallback;
  }

  // Allow safe web URLs, mailto, tel, and relative paths
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('whatsapp:') ||
    lower.startsWith('/') ||
    lower.startsWith('./') ||
    lower.startsWith('data:image/')
  ) {
    return clean;
  }

  // If no scheme is present, assume relative or safe default
  if (!clean.includes(':')) {
    return clean;
  }

  return fallback;
}

/**
 * Strips HTML tags and angle brackets from arbitrary user/admin text input.
 */
export function sanitizePlainText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // remove raw angle brackets
    .trim();
}

/**
 * Sanitizes strings for safe WhatsApp URL query parameters
 */
export function sanitizeWhatsAppMessage(text: string): string {
  if (!text) return '';
  // Remove script tags or dangerous sequences
  const clean = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return encodeURIComponent(clean);
}

/**
 * Deeply scrubs objects to prevent Prototype Pollution (__proto__, constructor, prototype)
 */
export function sanitizeObjectTree<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectTree(item)) as unknown as T;
  }

  const safeRecord: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn('[Security] Scrubbed potential prototype pollution key:', key);
      continue;
    }
    safeRecord[key] = sanitizeObjectTree(value);
  }

  return safeRecord as T;
}
