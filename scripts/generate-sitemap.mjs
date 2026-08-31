import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SITE_URL = 'https://poladcharkhesh.ir';

export function generateSitemap() {
  const productsFilePath = path.join(rootDir, 'src', 'data', 'products.ts');
  const content = fs.readFileSync(productsFilePath, 'utf8');

  // Extract all slugs from products.ts
  const slugMatches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);

  if (slugMatches.length === 0) {
    console.warn('Warning: No product slugs found in products.ts');
    return;
  }

  // Deduplicate and filter empty
  const uniqueSlugs = Array.from(new Set(slugMatches.filter(Boolean)));

  const sitemapLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${SITE_URL}/</loc>`,
    '    <changefreq>daily</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '  <url>',
    `    <loc>${SITE_URL}/#catalog</loc>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>0.9</priority>',
    '  </url>',
  ];

  for (const slug of uniqueSlugs) {
    sitemapLines.push(
      '  <url>',
      `    <loc>${SITE_URL}/product/${slug}</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>'
    );
  }

  sitemapLines.push('</urlset>\n');

  const sitemapXml = sitemapLines.join('\n');
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
  console.log(`✓ Generated canonical sitemap with ${uniqueSlugs.length} products at ${sitemapPath}`);
}

// If executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap();
}
