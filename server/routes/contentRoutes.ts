import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, logAudit } from '../middleware';

export const contentRouter = Router();

const DEFAULT_PAGE_CONTENT = {
  hero: {
    badgeFa: 'تأمین مستقیم و اصالت‌سنجی ۱۰۰٪ قطعات صنعتی',
    badgeEn: 'Direct Supply & 100% Authenticity Verification',
    titleHighlightFa: 'تأمین تخصصی انواع بیرینگ و برینگ‌های صنعتی',
    titleHighlightEn: 'Industrial Bearings & Sealing Systems',
    titleSuffixFa: 'مرجع مهندسی، محاسبه طول عمر L10 و کاتالوگ جامع قطعات صنایع مادر',
    titleSuffixEn: 'Engineering reference, ISO 281 L10 life calculator & technical catalog',
    descriptionFa: 'بازرگانی پولاد چرخِش؛ تأمین‌کننده مستقیم انواع رولبرینگ مخروطی، بشکه‌ای، بلبرینگ شیارعمیق، یاتاقان و کاسه‌نمد برای صنایع نفت، گاز، پتروشیمی، فولاد و سیمان.',
    descriptionEn: 'Polad Charkhesh Trading Co.; Direct distributor of tapered, spherical, deep groove bearings, housings and oil seals for oil & gas, steel, mining, and cement industries.',
    searchPlaceholderFa: 'جستجوی شماره فنی بیرینگ (مثال: 22220, 30205, 6205, 120x150x12)...',
    searchPlaceholderEn: 'Search bearing technical code or dimensions (e.g. 22220, 30205, 6205)...',
  },
  about: {
    tagFa: 'درباره ما',
    tagEn: 'About Us',
    titleFa: 'بیش از دو دهه تجربه تخصصی در تأمین قطعات دوار صنایع مادر',
    titleEn: 'Over Two Decades of Engineering Supply in Rotating Equipment',
    paragraph1Fa: 'بازرگانی پولاد چرخِش با اتکا به تخصص فنی، شناخت دقیق استانداردهای جهانی (ISO/DIN/ABMA) و ارتباط مستقیم با زنجیره تأمین بین‌المللی، آماده ارائه خدمات جامع مشاوره‌ای و تأمین بیرینگ‌های فوق سنگین، خاص و عمومی به پروژه‌های صنعتی سراسر کشور می‌باشد.',
    paragraph1En: 'Polad Charkhesh Trading relies on deep engineering expertise, compliance with international standards (ISO/DIN/ABMA), and direct relations with global manufacturers to provide heavy-duty and precision bearing solutions.',
    paragraph2Fa: 'تمامی قطعات وارداتی با مدارک اصالت کالا، تضمین عدم وجود خوردگی و گواهی آزمون متالورژی عرضه می‌گردند.',
    paragraph2En: 'All imported parts are supplied with complete certificates of conformity, anti-corrosion inspection, and certified metallurgical quality guarantees.',
    stats: [
      { valueFa: '+۶۸', valueEn: '+68', labelFa: 'کدهای استاندارد در کاتالوگ', labelEn: 'Catalogued Standard Series' },
      { valueFa: '+۱۰۰۰', valueEn: '+1000', labelFa: 'تأمین موفق پروژه‌های صنعتی', labelEn: 'Successful Project Deliveries' },
      { valueFa: '۱۰۰٪', valueEn: '100%', labelFa: 'تضمین اصالت برند و متریال', labelEn: 'Authenticity Guarantee' },
      { valueFa: '۲۴/۷', valueEn: '24/7', labelFa: 'مشاوره و استعلام فنی مهندسی', labelEn: 'Technical Engineering Support' },
    ],
  },
  footer: {
    descriptionFa: 'بازرگانی صنعتی پولاد چرخِش؛ مرجع تخصصی تأمین، مشاوره مهندسی و محاسبات فنی طول عمر انواع برینگ و پکینگ‌های آب‌بندی صنایع سنگین و مادر.',
    descriptionEn: 'Polad Charkhesh Industrial Trading; Specialized engineering distributor of industrial bearings, housings, and high-performance sealing systems.',
    copyrightFa: 'تمامی حقوق مادی و معنوی این سامانه متعلق به بازرگانی پولاد چرخِش می‌باشد.',
    copyrightEn: 'All rights reserved for Polad Charkhesh Industrial Trading Co.',
    disclaimerFa: 'محاسبات طول عمر L10 بر پایه روابط استاندارد بین‌المللی ISO 281:2007 و کاتالوگ‌های رسمی سازندگان صورت می‌پذیرد.',
    disclaimerEn: 'Calculations are performed strictly per ISO 281:2007 and verified official manufacturer engineering standards.',
  },
};

export { DEFAULT_PAGE_CONTENT };

/**
 * GET /api/content
 * Public CMS page content
 */
contentRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const row = db.prepare('SELECT data FROM cms_content WHERE id = ?;').get('main') as any;

  if (row && row.data) {
    try {
      res.json({ content: JSON.parse(row.data) });
      return;
    } catch {}
  }

  res.json({ content: DEFAULT_PAGE_CONTENT });
});

/**
 * PUT /api/content
 * Protected update to CMS content
 */
contentRouter.put('/', requireAuth, (req: Request, res: Response): void => {
  const updates = req.body || {};
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  let current = { ...DEFAULT_PAGE_CONTENT };
  const row = db.prepare('SELECT data FROM cms_content WHERE id = ?;').get('main') as any;
  if (row && row.data) {
    try {
      current = JSON.parse(row.data);
    } catch {}
  }

  const merged = {
    hero: { ...current.hero, ...(updates.hero || {}) },
    about: { ...current.about, ...(updates.about || {}) },
    footer: { ...current.footer, ...(updates.footer || {}) },
  };

  db.prepare(`
    INSERT INTO cms_content (id, data, updated_at, updated_by)
    VALUES ('main', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;
  `).run(JSON.stringify(merged), nowIso, req.admin!.username);

  logAudit('CONTENT_UPDATED', 'content', 'محتوای متنی صفحات وب‌سایت ویرایش گردید.', req, 'main');

  res.json({ success: true, content: merged });
});
