import { BearingProduct, Language } from '../types';
import { COMPANY_INFO } from '../data/company';
import { getProductSlug } from './productSlug';

export interface SeoUpdateOptions {
  product?: BearingProduct;
  language: Language;
  path: string;
  categoryLabel?: string;
}

const SITE_URL = 'https://poladcharkhesh.ir';

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

  if (product) {
    // --- INDIVIDUAL PRODUCT PAGE SEO ---
    const slug = getProductSlug(product);
    const canonicalUrl = `${SITE_URL}/product/${slug}`;
    
    // Dynamic Localized Title
    const title = isPersian
      ? `بلبرینگ ${product.code} | مشخصات فنی، ابعاد و دیتاشیت مهندسی | پولاد چرخِش`
      : `${product.code} Bearing | Technical Specifications, Dimensions & Datasheet | Polad Charkhesh`;
    
    // Dynamic Localized Meta Description with genuine parameters
    const description = isPersian
      ? `مشخصات فنی ${product.nameFa} با شماره فنی ${product.code} شامل ابعاد d=${product.d}mm, D=${product.D}mm, B=${product.B}mm، ظرفیت بار دینامیک Cr=${product.crKn}kN، دور مجاز و برندهای قابل تأمین. استعلام و مشاوره فنی با پولاد چرخِش.`
      : `Technical specifications for ${product.nameEn} (${product.code}): d=${product.d}mm, D=${product.D}mm, B=${product.B}mm, Dynamic Load Cr=${product.crKn}kN, Static Cor=${product.corKn}kN, Limiting Speeds, and available industrial brands at Polad Charkhesh.`;

    document.title = title;
    setMetaTag('description', description);
    setCanonicalUrl(canonicalUrl);

    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', 'product', true);
    setMetaTag('og:site_name', isPersian ? 'پولاد چرخِش' : 'Polad Charkhesh', true);
    if (product.imageUrl) {
      setMetaTag('og:image', product.imageUrl.startsWith('http') ? product.imageUrl : `${SITE_URL}${product.imageUrl}`, true);
    }

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    if (product.imageUrl) {
      setMetaTag('twitter:image', product.imageUrl.startsWith('http') ? product.imageUrl : `${SITE_URL}${product.imageUrl}`);
    }

    // 1. Schema.org Product Structured Data (Strictly NO fake prices / NO fake offers)
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': isPersian ? `${product.nameFa} - ${product.code}` : `${product.nameEn} - ${product.code}`,
      'mpn': product.code,
      'sku': product.id,
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
      productSchema.image = product.imageUrl.startsWith('http') ? product.imageUrl : `${SITE_URL}${product.imageUrl}`;
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
    const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;
    
    const title = isPersian
      ? 'پولاد چرخِش | تأمین و توزیع تخصصی انواع بیرینگ‌های صنایع نفت، معدن و فولاد'
      : 'PoladCharkhesh | Supply & Distribution of Heavy Oil, Mining & Steel Bearings';
    
    const description = isPersian
      ? 'پولاد چرخِش، مرکز تخصصی واردات، تأمین و توزیع بیرینگ‌ها و کاسه نمدهای صنعتی برندهای SKF, FAG, TIMKEN, NSK, NTN, KOYO با تضمین اصالت و مشاوره مهندسی تخصصی در تهران.'
      : 'Polad Charkhesh specializes in the supply, engineering consultation, and distribution of premium industrial bearings, housings, and sealing systems (SKF, FAG, TIMKEN, NSK, NTN, KOYO, CORTECO).';

    document.title = title;
    setMetaTag('description', description);
    setCanonicalUrl(canonicalUrl);

    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', isPersian ? 'پولاد چرخِش' : 'Polad Charkhesh', true);

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

  // --- ORGANIZATION / LOCAL BUSINESS SCHEMA (Always Active) ---
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#organization`,
    'name': isPersian ? COMPANY_INFO.nameFa : COMPANY_INFO.nameEn,
    'legalName': isPersian ? COMPANY_INFO.legalNameFa : COMPANY_INFO.legalNameEn,
    'alternateName': 'Polad Charkhesh Bearing Trading',
    'url': SITE_URL,
    'telephone': COMPANY_INFO.landlinePhone,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': isPersian ? COMPANY_INFO.addressFa : COMPANY_INFO.addressEn,
      'addressLocality': 'Tehran',
      'addressCountry': 'IR',
    },
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        'opens': '08:00',
        'closes': '16:00',
      },
    ],
    'contactPoint': [
      {
        '@type': 'ContactPoint',
        'telephone': '+989127195313',
        'contactType': 'Technical Sales & Engineering Support',
        'availableLanguage': ['Persian', 'English'],
      },
      {
        '@type': 'ContactPoint',
        'telephone': '+982177209117',
        'contactType': 'Office & Logistics Management',
        'availableLanguage': ['Persian'],
      },
    ],
  };
  setJsonLd('structured-data-org', orgSchema);
}
