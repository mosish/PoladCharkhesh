import { BearingProduct } from '../types';

/**
 * Generates a clean, lowercase, deterministic, URL-safe slug for a product.
 * Example: '6204-2rs', '6308-2z', '30208', 'snl-511-609', 'tc-35-52-10'
 */
export function getProductSlug(product: BearingProduct): string {
  if (product.slug) {
    return product.slug.toLowerCase().trim();
  }
  // Strip 'pc-' prefix if present, normalize spaces and slashes to hyphens
  const rawId = product.id.startsWith('pc-') ? product.id.slice(3) : product.id;
  return rawId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes an arbitrary string for fuzzy or case-insensitive matching.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[/\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, '')
    .replace(/^-+|-+$/g, '');
}

/**
 * Finds a product by slug, ID, or designation with multiple fallback levels.
 */
export function findProductBySlug(
  querySlug: string,
  products: BearingProduct[]
): BearingProduct | undefined {
  if (!querySlug || !products.length) return undefined;

  const cleanSlug = normalizeString(decodeURIComponent(querySlug));

  // 1. Direct slug or ID match
  const exactMatch = products.find((p) => {
    const slug = getProductSlug(p);
    return (
      slug === cleanSlug ||
      p.id.toLowerCase() === cleanSlug ||
      p.id.toLowerCase() === `pc-${cleanSlug}`
    );
  });
  if (exactMatch) return exactMatch;

  // 2. Match normalized product code (e.g. '6204-2RS' -> '6204-2rs')
  const codeMatch = products.find((p) => {
    const normCode = normalizeString(p.code);
    return normCode.includes(cleanSlug) || cleanSlug.includes(normCode);
  });
  if (codeMatch) return codeMatch;

  // 3. Fallback: alphanumeric match (e.g. '62042rs' or '63082zc3')
  const alphaNumSlug = cleanSlug.replace(/[^a-z0-9]/g, '');
  if (alphaNumSlug.length >= 3) {
    return products.find((p) => {
      const alphaNumId = p.id.replace(/[^a-z0-9]/g, '');
      const alphaNumCode = p.code.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        alphaNumId.includes(alphaNumSlug) ||
        alphaNumCode.includes(alphaNumSlug) ||
        alphaNumSlug.includes(alphaNumCode)
      );
    });
  }

  return undefined;
}

/**
 * Returns deterministic related products based on category, series, and dimensions.
 * No random ordering, strictly deterministic.
 */
export function getRelatedProducts(
  currentProduct: BearingProduct,
  allProducts: BearingProduct[],
  limit: number = 3
): BearingProduct[] {
  const candidates = allProducts.filter((p) => p.id !== currentProduct.id);

  // Score each candidate based on engineering similarity
  const scored = candidates.map((p) => {
    let score = 0;

    // Same category: +50 pts
    if (p.category === currentProduct.category) {
      score += 50;
    }

    // Same schematic type (e.g. deep-groove, tapered): +30 pts
    if (p.schematicType === currentProduct.schematicType) {
      score += 30;
    }

    // Shared brand: +10 pts
    const hasSharedBrand = p.brands.some((b) => currentProduct.brands.includes(b));
    if (hasSharedBrand) {
      score += 10;
    }

    // Proximity in bore diameter (d): up to +20 pts
    if (currentProduct.d > 0 && p.d > 0) {
      const dDiff = Math.abs(p.d - currentProduct.d);
      if (dDiff === 0) score += 20;
      else if (dDiff <= 10) score += 15;
      else if (dDiff <= 25) score += 8;
    }

    return { product: p, score };
  });

  // Sort descending by score, tie-break by ID for stability
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.id.localeCompare(b.product.id);
  });

  return scored.slice(0, limit).map((s) => s.product);
}

/**
 * Validates product catalog data at runtime for anomalies.
 */
export function validateProductData(products: BearingProduct[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const idSet = new Set<string>();
  const slugSet = new Set<string>();
  const codeSet = new Set<string>();

  products.forEach((p, index) => {
    // Check ID
    if (!p.id) {
      errors.push(`Product at index ${index} is missing an 'id'.`);
    } else if (idSet.has(p.id)) {
      errors.push(`Duplicate product ID found: '${p.id}'.`);
    } else {
      idSet.add(p.id);
    }

    // Check Slug
    const slug = getProductSlug(p);
    if (!slug) {
      errors.push(`Product '${p.id}' generated an empty slug.`);
    } else if (slugSet.has(slug)) {
      errors.push(`Duplicate slug '${slug}' for product '${p.id}'.`);
    } else {
      slugSet.add(slug);
    }

    // Check required fields & duplicate code
    if (!p.code) {
      errors.push(`Product '${p.id}' is missing 'code'.`);
    } else if (codeSet.has(p.code)) {
      errors.push(`Duplicate product code found: '${p.code}'.`);
    } else {
      codeSet.add(p.code);
    }

    if (!p.nameFa) errors.push(`Product '${p.id}' is missing 'nameFa'.`);
    if (!p.nameEn) errors.push(`Product '${p.id}' is missing 'nameEn'.`);
    if (!p.category) errors.push(`Product '${p.id}' is missing 'category'.`);
    if (p.d < 0 || p.D < 0 || p.B < 0) {
      errors.push(`Product '${p.id}' has negative dimensions (d=${p.d}, D=${p.D}, B=${p.B}).`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
