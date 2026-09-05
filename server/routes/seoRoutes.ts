import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, logAudit } from '../middleware';

export const seoRouter = Router();

const DEFAULT_SEO_CONFIG = {
  defaultTitleFa: 'بازرگانی پولاد چرخِش | کاتالوگ فنی بیرینگ و محاسبات مهندسی ISO 281',
  defaultTitleEn: 'Polad Charkhesh Bearings | Industrial Bearing Catalog & ISO Calculations',
  defaultDescriptionFa: 'کاتالوگ تخصصی بیرینگ، رولبرینگ‌های بشکه‌ای، مخروطی، استوانه‌ای، بلبرینگ و کاسه‌نمد با محاسبه آنلاین طول عمر L10 و استعلام مستقیم واتساپ در پولاد چرخِش.',
  defaultDescriptionEn: 'Technical industrial bearing catalog, deep groove, tapered & spherical roller bearings, oil seals and ISO 281 bearing life calculation tool by Polad Charkhesh.',
  canonicalBaseUrl: 'https://poladcharkhesh.ir',
  ogImageUrl: '/icon.png',
  keywordsFa: [
    'بیرینگ',
    'بلبرینگ',
    'رولبرینگ',
    'رولبرینگ مخروطی',
    'رولبرینگ بشکه‌ای',
    'کاسه نمد',
    'پولاد چرخش',
    'تیمکن',
    'اس کا اف',
    'محاسبه طول عمر بیرینگ',
  ],
  keywordsEn: [
    'bearings',
    'roller bearings',
    'tapered roller bearing',
    'spherical roller bearing',
    'deep groove ball bearing',
    'oil seals',
    'Polad Charkhesh',
    'SKF',
    'FAG',
    'TIMKEN',
    'ISO 281 calculation',
  ],
  organizationNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  organizationNameEn: 'Polad Charkhesh Industrial Trading Co.',
  googleSiteVerification: '',
};

export { DEFAULT_SEO_CONFIG };

/**
 * GET /api/seo
 * Public site SEO configuration
 */
seoRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const row = db.prepare('SELECT data FROM seo_config WHERE id = ?;').get('main') as any;

  if (row && row.data) {
    try {
      res.json({ seo: JSON.parse(row.data) });
      return;
    } catch {}
  }

  res.json({ seo: DEFAULT_SEO_CONFIG });
});

/**
 * PUT /api/seo
 * Protected update to SEO config
 */
seoRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const updates = req.body || {};
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  let current = { ...DEFAULT_SEO_CONFIG };
  const row = db.prepare('SELECT data FROM seo_config WHERE id = ?;').get('main') as any;
  if (row && row.data) {
    try {
      current = JSON.parse(row.data);
    } catch {}
  }

  const merged = {
    ...current,
    ...updates,
  };

  db.prepare(`
    INSERT INTO seo_config (id, data, updated_at, updated_by)
    VALUES ('main', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;
  `).run(JSON.stringify(merged), nowIso, req.admin!.username);

  logAudit('SEO_UPDATED', 'seo', 'تنظیمات سئو و متاتگ‌های وب‌سایت به‌روزرسانی شد.', req, 'main');

  res.json({ success: true, seo: merged });
});
