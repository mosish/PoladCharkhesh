# POLAD CHARKHESH — FULL-SITE CMS ARCHITECTURE & CONTENT MAP

## Purpose & Scope
This document specifies the complete content inventory and data architecture for the Polad Charkhesh Full-Site Content Management System (CMS). The goal is to allow administrators to manage **all public website content** via the Admin Panel without modifying React source code or redeploying the application, while preserving the authoritative SQLite backend architecture.

---

## Storage Schema & Model Foundation

All CMS content records are stored in the authoritative SQLite `cms_content` table established in Phase 7.0:

```sql
CREATE TABLE IF NOT EXISTS cms_content (
  id TEXT PRIMARY KEY,           -- section or page identifier (e.g., 'main')
  data TEXT NOT NULL,            -- serialized typed JSON payload
  updated_at TEXT NOT NULL,      -- ISO 8601 timestamp
  updated_by TEXT                -- admin username or 'system'
);
```

> **Schema Notice:** The production SQLite schema strictly uses the column name `data` (NOT `content_json`). All queries, migrations, and service handlers must interface with `data`.

For modular expansion in Phase 7.2, sections may be retrieved individually or aggregated into the central store.

---

## Comprehensive Content Map

### 1. Global Brand & Identity (`site_global`)
| Field Key | Type | Description | Canonical / Runtime Value |
| :--- | :--- | :--- | :--- |
| `companyNameFa` | `string` | Official Persian brand name | بازرگانی مهندسی پولاد چرخِش |
| `companyNameEn` | `string` | Official English brand name | Polad Charkhesh Engineering & Trading |
| `taglineFa` | `string` | Main Persian slogan | مرجع تخصصی محاسبات و تأمین بلبرینگ و رولبرینگ صنعتی |
| `taglineEn` | `string` | Main English slogan | Industrial Bearings & Engineering Calculations |
| `logoUrl` | `string` | Main website logo path | `/logo.png` |
| `faviconUrl` | `string` | Site favicon path | `/icon.png` |
| `copyrightFa` | `string` | Footer copyright text | تمامی حقوق متعلق به شرکت بازرگانی مهندسی پولاد چرخِش است. |
| `nationalId` | `string` | Commercial registration / national ID | [EXAMPLE ONLY — DO NOT SEED] `14000000000` |
| `economicCode` | `string` | Economic tax registration code | [EXAMPLE ONLY — DO NOT SEED] `411000000000` |

---

### 2. Contact & Communication Hub (`contact_info`)
> **Runtime Rule:** Do not seed fake or placeholder phone numbers, emails, addresses, or working hours into production or runtime database state. The table below provides canonical contact values from `src/data/company.ts` alongside explicitly marked speculative fields.

| Field Key | Type | Description | Value / Specification |
| :--- | :--- | :--- | :--- |
| `landlinePhones` | `string[]` | Central office landline numbers | Canonical: `['021-77209117']` |
| `directWhatsApp` | `string` | Direct WhatsApp inquiry phone number | Canonical: `+989127195313` |
| `telegramHandle` | `string` | Official Telegram channel / username | [EXAMPLE ONLY — DO NOT SEED] `@PoladCharkhesh` |
| `inquiryEmail` | `string` | Primary commercial inquiry email | Canonical: `info@poladcharkhesh.ir` |
| `technicalEmail`| `string` | Engineering consultation email | Canonical: `tech@poladcharkhesh.ir` |
| `officeAddressFa` | `string` | Central office address (Persian) | Canonical: `تهران، منطقه نارمک، خیابان دردشت، پلاک ۴۳۳` |
| `officeAddressEn` | `string` | English office address | Canonical: `No. 433, Dardasht St, Narmak, Tehran, Iran` |
| `warehouseAddressFa` | `string` | Industrial warehouse address | [EXAMPLE ONLY — DO NOT SEED] Optional secondary logistics site |
| `workingHoursWeekdays` | `string` | Working hours Saturday to Wednesday | Canonical: `شنبه تا چهارشنبه: ۰۸:۰۰ الی ۱۶:۰۰` |
| `workingHoursThursday` | `string` | Working hours Thursday | Canonical: `پنجشنبه: ۰۸:۰۰ الی ۱۲:۰۰` |
| `workingHoursFriday` | `string` | Weekend note | Canonical: `جمعه و ایام تعطیل: تعطیل` |
| `geoCoordinates` | `object` | Map latitude and longitude for office | Canonical: `{ lat: 35.7330, lng: 51.5120 }` |

---

### 3. Hero Section (`hero_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `headlineFa` | `string` | Main hero title | تأمین برینگ‌های صنعتی فوق‌سنگین و مهندسی |
| `headlineEn` | `string` | English hero title | Heavy-Duty Industrial Bearings Supply |
| `subheadingFa` | `string` | Hero descriptive paragraph | اصالت تضمین‌شده برندهای جهانی TIMKEN، SKF، FAG همراه با محاسبات مهندسی ISO 281 |
| `subheadingEn` | `string` | English hero subtitle | Guaranteed authenticity for SKF, TIMKEN, FAG with ISO engineering support |
| `primaryCtaTextFa` | `string` | First button call-to-action | استعلام فنی و پیش‌فاکتور |
| `primaryCtaLink` | `string` | Link target for primary CTA | `#inquiry` |
| `secondaryCtaTextFa` | `string` | Second button call-to-action | جستجوی کاتالوگ قطعات |
| `secondaryCtaLink` | `string` | Link target for secondary CTA | `#catalog` |
| `badgeItems` | `string[]` | Feature pills on hero banner | `['اصالت قطعات ۱۰۰٪', 'محاسبات عمر ISO 281', 'ارسال به سراسر کشور']` |
| `backgroundImageUrl` | `string` | Hero background texture/image | `/hero-bearing.jpg` |

---

### 4. About Us & Company Profile (`about_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `titleFa` | `string` | About section main title | درباره پولاد چرخِش |
| `storyFa` | `string` | Detailed corporate history & background | شرح سابقه دو دهه فعالیت در بازار برینگ‌های تخصصی |
| `missionFa` | `string` | Corporate mission statement | تأمین سریع برینگ‌های اصلی و جلوگیری از توقف خطوط تولید |
| `qualityPolicyFa` | `string` | Quality assurance and verification policy | گواهی بازرسی و راستی‌آزمایی فنی مطابق استانداردهای بین‌المللی |
| `stats` | `array` | Numerical milestones | `[{ number: '20+', label: 'سال سابقه' }, { number: '1000+', label: 'مشتری صنعتی' }]` |

---

### 5. Why Choose Polad Charkhesh (`benefits_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `sectionTitleFa` | `string` | Main section header | مزایای همکاری با پولاد چرخِش |
| `benefitsList` | `array` | List of corporate value pillars | Items with icon, title, and description: |
| ↳ `item.titleFa` | `string` | Pillar title | ضمانت ۱۰۰٪ اصالت و عدم عرضه کالای تقلبی |
| ↳ `item.descFa` | `string` | Detailed pillar description | ارائه مستندات ترخیص و اصالت برندهای تراز اول دنیا |
| ↳ `item.iconKey` | `string` | Lucide icon identifier | `ShieldCheck`, `CheckCircle2`, `Cpu`, etc. |

---

### 6. Industries Served (`industries_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `sectionTitleFa` | `string` | Header for industries | صنایع تحت پوشش و بازارهای هدف |
| `industries` | `array` | Array of industrial verticals | Vertical cards: |
| ↳ `mining` | `object` | Mining & Minerals (نورد، سنگ‌شکن‌ها، آسیاب گلوله‌ای) |
| ↳ `steel` | `object` | Iron & Steel Industry (خطوط نورد گرم و سرد، ریخته‌گری مداوم) |
| ↳ `cement` | `object` | Cement Manufacturing (کوره‌های دوار، یاتاقان‌های کوره) |
| ↳ `petrochemical`| `object` | Oil, Gas & Petrochemical (پمپ‌های فرآیندی، توربین‌ها) |
| ↳ `heavy_machinery`| `object`| Heavy Industrial Gearboxes (گیربکس‌های صنعتی فوق‌سنگین) |

Each industry object contains:
- `titleFa` / `titleEn`
- `descriptionFa` / `descriptionEn`
- `suggestedBearingCategories`: Array of relevant categories (e.g. `['roller', 'spherical']`)
- `imageUrl`: Visual illustration

---

### 7. Engineering & Consulting Team (`team_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `sectionTitleFa` | `string` | Section header | مشاوران و تیم فنی مهندسی |
| `sectionSubtitleFa`| `string` | Subtitle | متخصصان انتخاب برینگ و ارزیابی شرایط کاری ISO |
| `consultants` | `array` | List of technical consultants | Consultant profile cards: |
| ↳ `nameFa` / `nameEn`| `string` | Consultant name | مهندس مشاور ارشد بیرینگ |
| ↳ `roleFa` / `roleEn`| `string` | Specialization role | کارشناس ارشد ارتعاشات و روانکاری |
| ↳ `bioFa` | `string` | Professional background summary | متخصص با ۱۵ سال سابقه عیب‌یابی خرابی برینگ |
| ↳ `avatarUrl` | `string` | Photo or avatar | `/consultants/engineer1.jpg` |

---

### 8. Technical Disclaimers & Compliance (`disclaimers_section`)
| Field Key | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `isoCalculationNoteFa`| `string` | ISO calculation disclaimer | نتایج محاسبات عمر L10h بر اساس فرضیات استاندارد ISO 281 است. |
| `catalogAccuracyNoteFa`| `string` | Catalog specification notice | مشخصات فنی از کاتالوگ‌های رسمی سازندگان استخراج شده است. |
| `consultationNoticeFa`| `string` | Expert consultation notice | پیش از خرید، تأیید شرایط بارگذاری توسط کارشناسان الزامی است. |

---

### 9. Section Visibility Controls (`visibility_toggles`)
Allows immediate toggling of homepage sections without code edits:
| Field Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `showHeroStats` | `boolean` | `true` | Display numerical counters on hero |
| `showCalculators` | `boolean` | `true` | Display interactive engineering calculators |
| `showIndustries` | `boolean` | `true` | Display industries served section |
| `showTeam` | `boolean` | `true` | Display engineering consultants section |
| `showCatalogPdfDownloads`| `boolean` | `true` | Enable PDF datasheet generation buttons |
| `showEmergencyBanner` | `boolean` | `false` | Display urgent contact or holiday banner |
| `emergencyBannerTextFa`| `string` | `''` | Text displayed when emergency banner is active |

---

### 10. Site-Wide SEO & Metadata (`seo_config`)
| Field Key | Type | Description |
| :--- | :--- | :--- |
| `defaultMetaTitleFa` | `string` | Default Persian HTML title |
| `defaultMetaDescriptionFa` | `string` | Default Persian meta description |
| `canonicalBaseUrl` | `string` | Production canonical URL |
| `ogImageUrl` | `string` | OpenGraph social preview image |
| `keywordsGlobal` | `string[]` | Site-wide keywords for search engines |
| `googleSiteVerification` | `string` | Google Search Console token |
| `structuredDataOrg` | `object` | JSON-LD schema for Corporation / Merchant |

---

## Migration Path to Phase 7.2
1. **API Endpoints**: Extend `cmsRoutes.ts` with granular endpoints (`GET /api/cms/:section`, `PUT /api/cms/:section`).
2. **Admin UI Tabs**: Introduce dedicated CMS tabs in the Admin Panel corresponding to the sections above.
3. **Reactive Subscriptions**: Connect `dataService.subscribeToContent()` to hydrate all client sections dynamically.
