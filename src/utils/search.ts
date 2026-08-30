import { BearingProduct } from '../types';

export interface SearchResult {
  product: BearingProduct;
  score: number;
  matchType: 'exact_code' | 'partial_code' | 'brand_code' | 'name' | 'dimension' | 'application' | 'general';
}

export interface SearchOptions {
  category?: string;
  brand?: string;
  scope?: 'all' | 'code' | 'brand' | 'type' | 'app';
  minD?: number;
  maxD?: number;
  minOuterD?: number;
  maxOuterD?: number;
}

/**
 * Parses dimensions from queries like '20 47 14', '20x47x14', '20*47*14', '20×47×14', '20 47'
 */
function parseDimensionQuery(query: string): { d?: number; D?: number; B?: number } | null {
  const clean = query.trim().replace(/[×*xX/\\,-]+/g, ' ');
  const parts = clean.split(/\s+/).map((p) => parseFloat(p)).filter((n) => !isNaN(n) && n > 0);

  if (parts.length === 3) {
    return { d: parts[0], D: parts[1], B: parts[2] };
  }
  if (parts.length === 2) {
    return { d: parts[0], D: parts[1] };
  }
  if (parts.length === 1 && parts[0] > 5 && parts[0] <= 1000) {
    // Single number might be a bore or outer diameter
    return { d: parts[0] };
  }
  return null;
}

/**
 * Searches and ranks products based on multi-attribute relevance.
 */
export function searchAndRankProducts(
  products: BearingProduct[],
  rawQuery: string,
  options: SearchOptions = {}
): BearingProduct[] {
  const query = rawQuery.trim().toLowerCase();
  const dimQuery = query ? parseDimensionQuery(query) : null;

  const results: SearchResult[] = [];

  for (const product of products) {
    // Apply strict category filter if specified
    if (options.category && options.category !== 'all' && product.category !== options.category) {
      continue;
    }

    // Apply strict brand filter if specified
    if (options.brand && options.brand !== 'all') {
      const bQuery = options.brand.toLowerCase();
      const hasBrand = product.brands.some((b) => {
        const bLow = b.toLowerCase();
        if (bQuery === 'fag') return bLow.includes('fag') || bLow.includes('ina') || bLow.includes('schaeffler');
        if (bQuery === 'corteco') return bLow.includes('corteco') || bLow.includes('freudenberg');
        if (bQuery === 'koyo') return bLow.includes('koyo') || bLow.includes('jtekt');
        return bLow.includes(bQuery);
      });
      if (!hasBrand) continue;
    }

    // Apply dimensional boundary filters
    if (options.minD !== undefined && options.minD > 0 && product.d < options.minD) continue;
    if (options.maxD !== undefined && options.maxD > 0 && product.d > options.maxD) continue;
    if (options.minOuterD !== undefined && options.minOuterD > 0 && product.D < options.minOuterD) continue;
    if (options.maxOuterD !== undefined && options.maxOuterD > 0 && product.D > options.maxOuterD) continue;

    // If query is empty, return with baseline score
    if (!query) {
      results.push({ product, score: product.featured ? 10 : 0, matchType: 'general' });
      continue;
    }

    let score = 0;
    let matchType: SearchResult['matchType'] = 'general';

    const codeLower = product.code.toLowerCase();
    const codeAlphaNum = codeLower.replace(/[^a-z0-9]/g, '');
    const queryAlphaNum = query.replace(/[^a-z0-9]/g, '');
    const nameFaLower = product.nameFa.toLowerCase();
    const nameEnLower = product.nameEn.toLowerCase();
    const descFaLower = product.descriptionFa.toLowerCase();
    const descEnLower = product.descriptionEn.toLowerCase();

    // 1. EXACT PRODUCT CODE / DESIGNATION MATCH
    if (codeLower === query || codeAlphaNum === queryAlphaNum) {
      score += 200;
      matchType = 'exact_code';
    } else if (codeLower.startsWith(query) || (queryAlphaNum.length >= 3 && codeAlphaNum.startsWith(queryAlphaNum))) {
      score += 150;
      matchType = 'exact_code';
    } else if (codeLower.includes(query) || (queryAlphaNum.length >= 3 && codeAlphaNum.includes(queryAlphaNum))) {
      score += 120;
      matchType = 'partial_code';
    }

    // 2. BRAND + CODE COMBINATION (e.g. 'SKF 6204' or 'FAG 22216')
    for (const brand of product.brands) {
      const brandLower = brand.toLowerCase();
      if (query.includes(brandLower) && (codeLower.includes(query.replace(brandLower, '').trim()) || query.replace(brandLower, '').trim() === '')) {
        score += 110;
        if (matchType === 'general') matchType = 'brand_code';
      }
    }

    // 3. PRODUCT NAME & TYPE MATCH (Persian / English)
    if (nameFaLower.includes(query) || nameEnLower.includes(query)) {
      score += 85;
      if (matchType === 'general') matchType = 'name';
    }

    // 4. DIMENSIONAL EXACT MATCH (e.g. '20 47 14' or '20x47x14')
    if (dimQuery) {
      if (dimQuery.d !== undefined && dimQuery.D !== undefined && dimQuery.B !== undefined) {
        if (product.d === dimQuery.d && product.D === dimQuery.D && product.B === dimQuery.B) {
          score += 160;
          matchType = 'dimension';
        }
      } else if (dimQuery.d !== undefined && dimQuery.D !== undefined) {
        if (product.d === dimQuery.d && product.D === dimQuery.D) {
          score += 100;
          matchType = 'dimension';
        }
      } else if (dimQuery.d !== undefined && product.d === dimQuery.d) {
        score += 40;
        if (matchType === 'general') matchType = 'dimension';
      }
    }

    // Direct dimension substring matching (e.g. 'd=20' or '20mm')
    if (query.includes(`${product.d}x${product.D}`) || query.includes(`${product.d}*${product.D}`) || query.includes(`${product.d} ${product.D}`)) {
      score += 90;
      if (matchType === 'general') matchType = 'dimension';
    }

    // 5. APPLICATION KEYWORD MATCH
    const appFaMatch = product.applicationsFa.some((a) => a.toLowerCase().includes(query));
    const appEnMatch = product.applicationsEn.some((a) => a.toLowerCase().includes(query));
    if (appFaMatch || appEnMatch) {
      score += 60;
      if (matchType === 'general') matchType = 'application';
    }

    // 6. DESCRIPTION KEYWORD MATCH
    if (descFaLower.includes(query) || descEnLower.includes(query)) {
      score += 25;
    }

    // If query matches any token
    if (score > 0) {
      if (product.featured) score += 5; // slight boost for featured
      results.push({ product, score, matchType });
    }
  }

  // Sort descending by relevance score
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.code.localeCompare(b.product.code);
  });

  return results.map((r) => r.product);
}
