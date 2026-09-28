import type { CmsPageContent, SiteSeoConfig } from '../types/admin';
import { DEFAULT_COPY } from './siteCopy';

export const DEFAULT_PAGE_CONTENT: CmsPageContent = {
  copy: DEFAULT_COPY,
  hero: {
    badgeFa: 'مرجع تخصصی بلبرینگ و رولبرینگ صنعتی در ایران',
    badgeEn: 'Specialized Industrial Bearings & Power Transmission Hub',
    titleHighlightFa: 'تأمین مهندسی',
    titleHighlightEn: 'Engineering Supply',
    titleSuffixFa: 'انواع بلبرینگ‌های اورجینال صنایع سنگین',
    titleSuffixEn: 'of Heavy Industrial Bearings',
    descriptionFa: 'تأمین مستقیم انواع بیرینگ‌های فوق دقیق، توربین، آسیاب، پمپ و گیربکس از برترین برندهای معتبر جهان (SKF, FAG, NSK, TIMKEN) با تضمین اصالت و شناسنامه فنی کالا.',
    descriptionEn: 'Direct procurement of precision bearings for turbines, mills, pumps, and gearboxes from world-class manufacturers (SKF, FAG, NSK, TIMKEN) with verified certificates.',
    searchPlaceholderFa: 'جستجو بر اساس شماره فنی کالا، ابعاد مهندسی یا دسته‌بندی...',
    searchPlaceholderEn: 'Search by technical bearing code, dimensions, or category...',
  },
  about: {
    tagFa: 'اصالت و اعتبار مهندسی',
    tagEn: 'ENGINEERING HERITAGE & TRUST',
    titleFa: 'بیش از دو دهه تجربه در قلب صنعت کشور',
    titleEn: 'Over Two Decades of Core Industrial Expertise',
    paragraph1Fa: 'بازرگانی صنعتی پولاد چرخِش با اتکا به دانش مهندسی متالورژی و شناخت دقیق نیازمندی‌های کارخانجات فولاد، سیمان، نفت و پتروشیمی، همواره مطمئن‌ترین همراه صنایع مادر ایران در تأمین قطعات حساس دوار بوده است.',
    paragraph1En: 'Polad Charkhesh Industrial Trading leverages metallurgical expertise and in-depth understanding of steel, cement, oil, and petrochemical plants to reliably supply critical rotating equipment.',
    paragraph2Fa: 'ما با ایجاد زنجیره تأمین مستقیم بین‌المللی و آزمایشگاه کنترل کیفیت ابعادی و ارتعاشاتی، هرگونه ریسک خرابی زودرس و توقف خطوط تولید را به صفر نزدیک می‌کنیم.',
    paragraph2En: 'Through direct global procurement and stringent dimensional/vibrational quality control, we minimize unexpected downtime risks for industrial manufacturing lines.',
    stats: [
      { valueFa: '۲۲+', valueEn: '22+', labelFa: 'سال سابقه تخصصی', labelEn: 'Years Experience' },
      { valueFa: '۱۰۰٪', valueEn: '100%', labelFa: 'تضمین اصالت کالا', labelEn: 'Authenticity Guarantee' },
      { valueFa: '۶۸+', valueEn: '68+', labelFa: 'شماره فنی در انبار دائم', labelEn: 'Audited Product Lines' },
      { valueFa: '۲۴/۷', valueEn: '24/7', labelFa: 'پشتیبانی فنی مهندسی', labelEn: 'Engineering Support' },
    ],
  },
  footer: {
    descriptionFa: 'مرکز تخصصی تأمین و مشاوره فنی انواع بیرینگ‌های صنعتی، گریس‌های تخصصی و کاسه‌نمدهای اورجینال صنایع نفت، گاز، پتروشیمی، فولاد و سیمان.',
    descriptionEn: 'Specialized industrial supplier of certified bearings, premium lubricants, and heavy-duty mechanical seals.',
    copyrightFa: 'تمامی حقوق مادی و معنوی برای بازرگانی صنعتی پولاد چرخِش محفوظ است.',
    copyrightEn: 'All rights reserved for Polad Charkhesh Industrial Trading Co.',
    disclaimerFa: 'اطلاعات فنی ارائه شده در این پلتفرم بر اساس استانداردهای DIN و ISO 281 گردآوری شده و جنبه مرجع مهندسی دارد.',
    disclaimerEn: 'Technical specifications are compiled according to DIN and ISO 281 engineering standards.',
  },
};

export const DEFAULT_SEO_CONFIG: SiteSeoConfig = {
  defaultTitleFa: 'بازرگانی پولاد چرخِش | مرجع تخصصی تأمین بلبرینگ و رولبرینگ صنعتی',
  defaultTitleEn: 'Polad Charkhesh | Industrial Bearings & Engineering Supply',
  defaultDescriptionFa: 'تأمین مستقیم انواع بلبرینگ و رولبرینگ صنعتی، برینگ‌های شیار عمیق، مخروطی، بشکه‌ای، خودتنظیم و کف‌گرد با تضمین اصالت و مشخصات استاندارد DIN / ISO.',
  defaultDescriptionEn: 'Direct supplier of industrial ball & roller bearings, tapered, spherical, and thrust bearings with guaranteed authenticity and ISO 281 standards compliance.',
  canonicalBaseUrl: 'https://poladcharkhesh.ir',
  ogImageUrl: '/polad-og-banner.jpg',
  keywordsFa: ['بلبرینگ', 'رولبرینگ', 'بلبرینگ صنعتی', 'SKF', 'FAG', 'تأمین قطعات صنایع فولاد', 'کاتالوگ بلبرینگ'],
  keywordsEn: ['bearings', 'industrial bearings', 'SKF bearings', 'roller bearings', 'tapered roller bearing', 'ISO 281'],
  organizationNameFa: 'بازرگانی صنعتی پولاد چرخِش',
  organizationNameEn: 'Polad Charkhesh Industrial Trading Co.',
  googleSiteVerification: '',
};

