# Polad Charkhesh — Secure Admin & Data Management Architecture (Phase 6)

## 1. Overview & Architecture
The Polad Charkhesh Admin Architecture is an engineering-grade, secure data management engine designed to decouple technical catalog data, company identity, contact numbers, working hours, and SEO metadata from static React component files.

### Architectural Principles:
1. **Zero Silent Calculator Corruption**: All catalog edits pass through strict ISO 281 engineering sanity checks ($D > d > 0$, $B > 0$, $C_r > 0$, $C_{0r} > 0$, non-negative speed ratings) before persisting.
2. **Cryptographic Protection**: Master passwords are protected using the **PBKDF2-HMAC-SHA256** standard (100,000 iterations + 16-byte random salt). Sessions are cryptographically signed using **HMAC-SHA256**.
3. **Continuous Audit Trail**: Every administrative action (`PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_DELETE`, `AUTH_LOGIN`, `PASSWORD_CHANGE`, `DATASET_RESTORE`, etc.) is permanently recorded in an immutable ledger with timestamps and user details.
4. **Single Source of Truth (`dataService`)**: Serves both public UI components and administrative modules with a reactive subscription pattern.

---

## 2. Accessing the Admin Portal
- **Direct Path**: Navigate to `/admin` or `/#admin` in the browser.
- **Footer Link**: Discreet `[Admin]` link located at the bottom-right corner of the website footer.
- **Default Development / Demo Credentials**:
  - **Username**: `admin`
  - **Password**: `admin123`
  - *Note*: You can change this password immediately from the **Security & Backup (`/admin/system`)** tab.

---

## 3. Administrative Modules

### 1. Overview & Status (`/admin/overview`)
- Live overview metrics: total items (68+), active vs archived items, ISO calculation factor coverage, unique brand counts, and security audit log count.
- **Live Dataset Integrity Check**: Automatically verifies 100% health of all 68 items against duplicate technical codes and missing dimensions.
- Quick action shortcuts (Add Product, Backup JSON, Edit Profile).

### 2. Product Catalog Manager (`/admin/products`)
- Full searchable data table with category filters (Tapered, Spherical, Deep Groove, Cylindrical, Thrust, Housing, Oil Seal, Lubricant) and status filters (Active, Archived).
- Add new product / Edit existing product with a 6-tab modal:
  - **Identity**: Technical code, category, names, descriptions, in-stock & featured flags.
  - **Dimensions & Loads (ISO)**: $d, D, B, \text{weight}, C_r, C_{0r}, N_{\text{grease}}, N_{\text{oil}}, r_{\min}$, cage material, sealing type.
  - **Calculation Factors (ISO 281 / 76)**: Factors $e, Y, Y_0, Y_1, Y_2, f_0$, and 3D schematic model selection with live safety lock indicator.
  - **Media & PDF**: Image URLs, datasheets.
  - **Brands & Applications**: Multi-brand tag chips (SKF, FAG, TIMKEN, NSK, etc.) and industry tags.
  - **Technical Sources & SEO**: Manufacturer catalog reference, table citation, verified dates.

### 3. Media & Images (`/admin/media`)
- Product gallery manager to inspect visual assets and update image URLs without code rewrites.

### 4. Company Identity (`/admin/company`)
- Edit official legal names, slogans, direct mobile phone numbers, office landlines, WhatsApp numbers, physical addresses, and working hours.

### 5. Contact Channels & Inquiries (`/admin/contact`)
- Customize WhatsApp inquiry message templates with `{code}` auto-substitution.
- Activity ledger tracking all incoming consultation requests from the public site.

### 6. Page Content CMS (`/admin/content`)
- Edit public website headlines, Hero badges, highlighted keywords, About Us paragraphs, and footer disclaimers in real time.

### 7. SEO & Meta Tags (`/admin/seo`)
- Configure Google SERP meta titles, meta descriptions, canonical URLs, OpenGraph images, and search keywords with a live Google result preview card.

### 8. Security, Audit Trail & Backups (`/admin/system`)
- Master password changer with PBKDF2 hashing.
- **Export Backup**: Download complete JSON snapshot of the entire store and catalog.
- **Restore Backup**: Upload and validate JSON backup files.
- **Factory Reset**: Revert any test edits back to the canonical 68 baseline products with double confirmation.
- Filterable and searchable security audit log ledger.

---

## 4. Security & Environment Configuration
- Never commit real passwords, secrets, or API keys to GitHub or version control.
- Copy `.env.example` to `.env` in production.
- Real `.env` files are ignored by git via `.gitignore`.
- Rate limiting is enforced: accounts are temporarily locked out after 5 consecutive failed login attempts.
