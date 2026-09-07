import { BearingProduct, Language } from '../types';
import { dataService } from '../services/dataService';
import { getProductSlug } from './productSlug';
import { SITE_ORIGINS } from './siteDomains';
import type { CompanyContactInfo } from '../data/company';

export interface SeoUpdateOptions {
  product?: BearingProduct;
  language: Language;
  path: string;
  categoryLabel?: string;
}

// Emit machine-readable hours only when the authoritative text has an unambiguous range.
export function getOpeningHours(company: CompanyContactInfo): string | undefined {
  const match = company.workingHoursEn.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat):\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*-\s*((?:[01]\d|2[0-3]):[0-5]\d)$/);
  if (!match) return undefined;
  const days: Record<string, string> = { Sun: 'Su', Mon: 'Mo', Tue: 'Tu', Wed: 'We', Thu: 'Th', Fri: 'Fr', Sat: 'Sa' };
  return days[match[1]] + '-' + days[match[2]] + ' ' + match[3] + '-' + match[4];
}

function setMetaTag(nameOrProperty: string, content: string, isProperty: boolean = false) {
  const attributeName = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attributeName}="${nameOrProperty}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeName, nameOrProperty);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setCanonicalUrl(url: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(id: string, schema: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema, null, 2);
}

/**
 * Updates document title, meta descriptions, canonical link, Open Graph, Twitter Cards,
 * and Schema.org structured data dynamically for both Home/Catalog and individual Product pages.
 */
export function updateDocumentSeo({ product, language, path, categoryLabel }: SeoUpdateOptions): void {
  const isPersian = language === 'fa';
  const SITE_URL = SITE_ORIGINS[language];
  const company = dataService.getCompanyInfo();
  const siteName = isPersian ? company.nameFa : company.nameEn;
  const seo = dataService.getSeoConfig();
  // Clear inherited images when navigating away from a product or to one without an image.
  document.querySelector('meta[property="og:image"]')?.remove();
  document.querySelector('meta[name="twitter:image"]')?.remove();
  setMetaTag('og:locale', isPersian ? 'fa_IR' : 'en_US', true);
  const pagePath = product ? '/product/' + getProductSlug(product) : path.split(/[?#]/)[0];
  for (const lang of ['fa', 'en'] as const) {
    let alternate = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
    if (!alternate) {
      alternate = document.createElement('link');
      alternate.setAttribute('rel', 'alternate');
      alternate.setAttribute('hreflang', lang);
      document.head.appendChild(alternate);
    }
    alternate.setAttribute('href', SITE_ORIGINS[lang] + (pagePath === '/' ? '' : pagePath));
  }

  if (product) {
    // --- INDIVIDUAL PRODUCT PAGE SEO ---
    const slug = getProductSlug(product);
    const canonicalUrl = `${SITE_URL}/product/${slug}`;
    
    // Dynamic Localized Title
    const title = isPersian
      ? `بلبرینگ ${product.code} | مشخصات فنی، ابعاد و دیتاشیت مهندسی | ${siteName}`
      : `${product.code} Bearing | Technical Specifications, Dimensions & Datasheet | ${siteName}`;
    
    // Dynamic Localized Meta Description with genuine parameters
    const description = isPersian
      ? `مشخصات فنی ${product.nameFa} با شماره فنی ${product.code} شامل ابعاد d=${product.d}mm, D=${product.D}mm, B=${product.B}mm، ظرفیت بار دینامیک Cr=${product.crKn}kN، دور مجاز و برندهای قابل تأمین. استعلام و مشاوره فنی با ${siteName}.`
      : `Technical specifications for ${product.nameEn} (${product.code}): d=${product.d}mm, D=${product.D}mm, B=${product.B}mm, Dynamic Load Cr=${product.crKn}kN, Static Cor=${product.corKn}kN, Limiting Speeds, and available industrial brands at ${siteName}.`;

    document.title = title;
    setMetaTag('description', description);
    setCanonicalUrl(canonicalUrl);

    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', 'product', true);
    setMetaTag('og:site_name', siteName, true);
    if (product.imageUrl) {
      setMetaTag('og:image', new URL(product.imageUrl, SITE_URL).href, true);
    }

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    if (product.imageUrl) {
      setMetaTag('twitter:image', new URL(product.imageUrl, SITE_URL).href);
    }

    // 1. Schema.org Product Structured Data (Strictly NO fake prices / NO fake offers)
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': isPersian ? `${product.nameFa} - ${product.code}` : `${product.nameEn} - ${product.code}`,
      'mpn': product.code,
      'sku': product.id,
      'url': canonicalUrl,
      'description': isPersian ? product.descriptionFa : product.descriptionEn,
      'category': isPersian ? categoryLabel || product.category : product.category,
      'weight': {
        '@type': 'QuantitativeValue',
        'value': product.weightKg,
        'unitCode': 'KGM',
      },
      'additionalProperty': [
        {
          '@type': 'PropertyValue',
          'name': 'Bore Diameter (d)',
          'value': `${product.d} mm`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Outside Diameter (D)',
          'value': `${product.D} mm`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Width (B)',
          'value': `${product.B} mm`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Dynamic Load Rating (Cr)',
          'value': `${product.crKn} kN`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Static Load Rating (Cor)',
          'value': `${product.corKn} kN`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Grease Limiting Speed',
          'value': `${product.speedGreaseRpm} RPM`,
        },
        {
          '@type': 'PropertyValue',
          'name': 'Oil Limiting Speed',
          'value': `${product.speedOilRpm} RPM`,
        },
      ],
    };

    // Truthful Brand / Manufacturer Representation
    if (product.technicalSources && product.technicalSources.length > 0 && product.technicalSources[0].manufacturer) {
      productSchema.manufacturer = {
        '@type': 'Organization',
        'name': product.technicalSources[0].manufacturer,
      };
    }

    if (product.brands && product.brands.length > 0) {
      if (product.brands.length === 1) {
        productSchema.brand = {
          '@type': 'Brand',
          'name': product.brands[0],
        };
      } else {
        productSchema.brand = product.brands.map((b) => ({
          '@type': 'Brand',
          'name': b,
        }));
      }
    }

    if (product.imageUrl) {
      productSchema.image = new URL(product.imageUrl, SITE_URL).href;
    }

    setJsonLd('structured-data-product', productSchema);

    // 2. Schema.org BreadcrumbList Structured Data
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': isPersian ? 'صفحه اصلی' : 'Home',
          'item': `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': isPersian ? 'کاتالوگ قطعات صنعتی' : 'Product Catalog',
          'item': `${SITE_URL}/#catalog`,
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': categoryLabel || (isPersian ? 'دسته‌بندی بیرینگ' : 'Bearing Category'),
          'item': `${SITE_URL}/#catalog`,
        },
        {
          '@type': 'ListItem',
          'position': 4,
          'name': product.code,
          'item': canonicalUrl,
        },
      ],
    };
    setJsonLd('structured-data-breadcrumbs', breadcrumbSchema);

  } else {
    // --- HOMEPAGE / CATALOG SEO ---
    const canonicalUrl = `${SITE_URL}${pagePath === '/' ? '' : pagePath}`;
    
    const title = isPersian ? seo.defaultTitleFa : seo.defaultTitleEn;
    const description = isPersian ? seo.defaultDescriptionFa : seo.defaultDescriptionEn;

    document.title = title;
    setMetaTag('description', description);
    setCanonicalUrl(canonicalUrl);

    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', siteName, true);

    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);

    // Remove single product schema on homepage
    const prodScript = document.getElementById('structured-data-product');
    if (prodScript) prodScript.remove();

    // Home Breadcrumbs
    const homeBreadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': isPersian ? 'صفحه اصلی' : 'Home',
          'item': `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': isPersian ? 'کاتالوگ و بانک قطعات' : 'Product Catalog',
          'item': `${SITE_URL}/#catalog`,
        },
      ],
    };
    setJsonLd('structured-data-breadcrumbs', homeBreadcrumbSchema);
  }

  // Publish company structured data only after a successful authoritative API response.
  if (!dataService.hasAuthoritativeCompanyData()) {
    document.getElementById('structured-data-org')?.remove();
    return;
  }
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL + '/#organization',
    name: siteName,
    legalName: isPersian ? company.legalNameFa : company.legalNameEn,
    url: SITE_URL,
    telephone: company.primaryPhone,
    email: company.email,
    description: isPersian ? company.workingHoursFa : company.workingHoursEn,
    address: {
      '@type': 'PostalAddress',
      streetAddress: isPersian ? company.addressFa : company.addressEn,
      addressLocality: isPersian ? company.cityFa : company.cityEn,
    },
    openingHours: getOpeningHours(company),
    contactPoint: [
      { '@type': 'ContactPoint', telephone: company.primaryPhone, contactType: 'Technical Sales & Engineering Support', availableLanguage: ['Persian', 'English'] },
      { '@type': 'ContactPoint', telephone: company.landlinePhone, contactType: 'Office & Logistics Management', availableLanguage: ['Persian'] },
    ],
  };
  setJsonLd('structured-data-org', orgSchema);
}
