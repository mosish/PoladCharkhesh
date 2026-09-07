import { Router } from 'express';
import { productDb } from '../services/productDb';
import { SITE_ORIGINS, resolveInitialLanguage } from '../../src/utils/siteDomains';
import { getProductSlug } from '../../src/utils/productSlug';

export const publicSeoRouter = Router();

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}

// Exact recognized hosts choose an official domain; forwarded/preview hosts cannot create URLs.
function getLanguage(host: string | undefined) {
  return resolveInitialLanguage((host || '').split(':')[0], null);
}

publicSeoRouter.get('/robots.txt', (req, res) => {
  const origin = SITE_ORIGINS[getLanguage(req.get('host'))];
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
});

publicSeoRouter.get('/sitemap.xml', (req, res) => {
  try {
    const origin = SITE_ORIGINS[getLanguage(req.get('host'))];
    const paths = ['', ...productDb.getAllProducts(false).map(product => '/product/' + getProductSlug(product))];
    const urls = [...new Set(paths)].map(pagePath => {
      const alternates = (['fa', 'en'] as const).map(language =>
        `    <xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(SITE_ORIGINS[language] + pagePath)}" />`
      ).join('\n');
      return `  <url>\n    <loc>${escapeXml(origin + pagePath)}</loc>\n${alternates}\n  </url>`;
    });
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
  } catch {
    // Never fall through to the historical public/sitemap.xml on database failure.
    res.status(503).type('text/plain').send('Sitemap temporarily unavailable');
  }
});
