# Polad Charkhesh — پولاد چرخش

> **Project status:** Independent audit: NOT READY for deployment candidate freeze
> **Source of truth:** `main` branch
> **Last status review:** 2026-09-28

Polad Charkhesh is a bilingual Persian/English B2B industrial engineering website focused on bearings, mechanical components, technical product information, engineering tools, datasheets, and direct consultation.

This project is **not an e-commerce website**. There is no online pricing, shopping cart, checkout, payment gateway, or Buy Now flow. The intended journey is:

**Discover Product → Review Technical Data → Use Engineering Information → Review Datasheet → Contact Polad Charkhesh**

---

## Current Project Status

The independent audit of main `9221340` found unresolved catalog reconciliation and launch requirements. Build success alone does not certify readiness. See [the audit report](docs/FINAL_PREDEPLOY_AUDIT.md) and its reproducible evidence. No deployment was performed.

Current sequence:

**Stabilize → Audit → Fix → Freeze → Deploy**

### Progress overview

| Area | Verified status |
|---|---|
| Public RTL/LTR and responsive layout | Representative Chrome checks at 390px / 1440px; not cross-browser certification |
| Product catalog | 68 static / 68 SQLite, unique IDs/codes/slugs; 142 field differences remain |
| Engineering formulas | Existing regression checks pass; SQLite/reference reconciliation FAILS |
| Product detail / Quick View | Direct production route and modal tested |
| Backend / authentication | API, authorization, sessions and production startup tests pass within audited scope |
| Product management | Existing integrity suite passes; public media/stock integration remains partial |
| Company settings | API-backed; unverified business claims and values require owner review |
| CMS | Nine section models persist and render; coverage and bilingual editors remain PARTIAL |
| Customer inquiries | API-backed storage and triage; browser rendering checked |
| SEO | Site metadata now consumes saved values; product overrides and sitemap remain partial |
| Backup / restore | Isolated business-data roundtrip and safety snapshots tested; physical files need separate backup |
| Media | Physical upload tested; safe metadata removal retains bytes; 29 broken catalog images remain |
| Admin responsive UX | Representative Chrome checks; not every control has an end-to-end browser test |
| Multi-agent integration | Isolated audit branch; old overlapping PRs not merged |
| Final independent audit | Findings and scoped fixes documented; unresolved P0/P1 remain |
| Deployment candidate freeze | BLOCKED |
| VPS deployment / HTTPS smoke test | NOT STARTED |

---

## Admin / CMS Status

The Admin Panel has evolved into a **Website Control Center** rather than a simple product editor.

Current management modules include:

- **Overview & Status**
- **Product Catalog**
- **Media & Images**
- **Customer Inquiries**
- **Website Settings**
- **Page Content (CMS)**
- **SEO & Meta Tags**
- **Security & Backup**

### Product Management

The product catalog is managed through the backend and SQLite data layer.

Current capabilities include:

- Create and edit products
- Archive / unarchive
- Duplicate products
- Featured status
- Stock/status controls
- Product images/gallery
- PDF datasheet association
- Technical product information
- Backend-backed persistence

The canonical catalog currently contains **68 products** and product integrity must remain protected during all future changes.

### Company & Global Settings

The admin includes centralized management for:

- Persian/English company identity
- Company/legal names
- Persian/English addresses
- Mobile and landline numbers (09127195313, 09126172282, 02177209117, 02133939482)
- WhatsApp
- Email/contact information
- Structured working hours (08:00 - 16:00)
- Global website settings
- CTA/contact visibility
- Site-wide communication settings

Most contact surfaces consume company data. Some fallback values and business claims remain in runtime sources; see the company hygiene findings.

### Full-Site CMS

CMS coverage has been expanded across major public sections, including:

- Hero
- About
- Catalog headings/content
- Engineering Tools headings/content
- Benefits / Why Us
- Industries
- Team (gracefully hidden when roster is unverified)
- Contact
- Footer
- Selected shared public headings and copy

Coverage is partial: mission/vision, hero statistics and other marketing claims remain hardcoded. Repeatable sections use JSON editors, and some English fields are still absent from Admin. Saving a CMS model is not proof that every public sentence is CMS-managed.

### Customer Inquiries

Website inquiries are stored and manageable from Admin.

Supported workflow:

**New → Reviewed → Contacted → Closed**

Admins can search/filter inquiries and track customer follow-up.

### Media Library

The Media module currently provides:

- Physical file upload (JPEG, PNG, WebP, PDF up to 10 MB) with magic-byte verification and path-traversal prevention
- Persistent storage in `data/uploads/` and static serving via `/uploads`
- Media records, categories, and bilingual alt text in SQLite
- Product associations and gallery management (attach, detach, primary, move, datasheet PDF)
- Reference checking preventing accidental deletion of assets in active use
- Removal of unreferenced metadata while retaining physical bytes for backup recovery
- Immutable file identity; register a new asset instead of rewriting an existing URL

Public sliders still show one photo plus CAD, and do not consume gallery order or media alt text. Associated PDF links are not yet surfaced in ProductPage/Quick View. Metadata associations do not automatically attach assets to products.

### Backup, Security & Audit

Admin/System functionality includes:

- Password management (PBKDF2)
- Dataset/database backup export (including products, company, CMS, SEO, media metadata, and inquiries)
- Backup restore with automatic pre-restore safety snapshots
- Factory Reset restricted to `superadmin`, with a pre-reset business-data safety snapshot
- Reset still replaces live engineering values with bundled reference values: reconcile the catalog differences before operational use
- Append-only application audit logging with IP tracking (not tamper-proof against direct database access)
- Security/system management

---

## Verified Local Checks and Runtime Configuration

Use Node.js with `node:sqlite` support (audit used Node 24.19.0). Run from the repository root:

```sh
npm install --no-audit --no-fund
npm run lint
npm run build
node scripts/runIsolated.mjs scripts/verifyCatalog.ts scripts/auditCalculations.ts scripts/verifyPhase720.ts scripts/verifyPhase701Integrity.ts server/scripts/testBackend.ts server/scripts/verifyPhase622.ts scripts/verifyMediaAndLaunchIntegrity.ts scripts/auditFinalPredeploy.ts
```

The final command intentionally exits nonzero while the committed SQLite/reference discrepancies remain. Browser verification: `node scripts/auditProduction.mjs` requires Playwright and an installed browser; `PLAYWRIGHT_MODULE_PATH` can select an existing installation and `PLAYWRIGHT_CHANNEL=chrome` uses installed Chrome. It currently fails the image-decoding check. See the audit report for exact results, not old script banners claiming universal correctness.

`npm start` does not load `.env`. Supply environment variables through a process manager or use `node --env-file=.env dist/server.cjs`. Keep `DATABASE_PATH` on persistent writable storage and back up both SQLite and the adjacent `uploads/` directory. JSON exports contain business data and media metadata, **not uploaded bytes, credentials, active sessions, the audit log, or deployment secrets**. Pre-reset/pre-restore snapshots live in SQLite and need operator-assisted recovery. Never overwrite the live database with the tracked seed on an update.

Behind a same-host proxy use `HOST=127.0.0.1`, explicit `PORT`, strong independent random secrets, HTTPS, and the matching `TRUST_PROXY`. Initialize the first admin before exposing the site publicly. The local audit checks cookie flags and restart behavior; it does not certify Nginx, TLS, or the target VPS.

---

## Architecture

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Responsive RTL/LTR interface
- Persian and English UI

### Backend

- Express
- SQLite
- Domain/service-based data access
- Server-side sessions/authentication
- HttpOnly cookie-based authentication
- Protected admin APIs
- Validation and field whitelisting
- Audit logging

### Runtime Data Authority

The SQLite-backed API is the runtime source of truth.

Bundled/static product data must not silently replace authoritative production data. Static canonical data is retained only where explicitly required for development/reference/recovery workflows.

---

## Product & Engineering Principles

Products are presented as **engineering catalog entries**, not retail merchandise.

Typical product information includes:

- Product identity and designation
- Category/family
- Manufacturer/brand information
- Technical specifications
- Dimensions
- Applications
- Engineering notes
- Speed/thermal information where applicable
- Technical sources
- Datasheets/documentation

Engineering calculations and product technical data are high-integrity areas and should not be casually modified during UI/CMS work.

---

## Design Direction

The visual language is industrial, technical, precise, and professional.

Core principles:

- Precision
- Engineering
- Reliability
- Industrial strength
- Clear technical hierarchy
- Product-focused presentation
- Generous spacing
- Strong typography
- Responsive design

Primary brand colors include:

- `#2f338a`
- `#90CAF9`
- `#2196F3`
- Bronze accent

Typography:

- **IRANSans** — Persian (self-hosted)
- **Outfit** — English
- **JetBrains Mono** — technical codes / part numbers

---

## Language & Domain Strategy

The website is bilingual:

- Persian-first experience for `.ir`
- English-first experience for `.com`
- Manual language switching remains available

All new CMS/admin functionality should preserve RTL/LTR behavior and bilingual content parity.

---

## Non-Negotiable Business Rules

The website must remain B2B and consultation-driven.

Do **not** add:

- Online prices
- Shopping cart
- Checkout
- Payment gateway
- Buy Now
- Retail-style purchasing flows

Commercial details such as price, availability, quantity, alternatives, and ordering are handled through direct consultation.

---

## Development History

### Foundation

The project began with the industrial design system, bilingual public website, product discovery, technical catalog, and engineering-focused UX.

### Product Data & Engineering

The product model was progressively enriched with technical specifications, manufacturer/source references, dimensions, engineering calculations, PDF export, thermal/speed information, and product-specific engineering behavior.

### Backend & Security

The project moved from frontend/local state toward an Express + SQLite backend with server-side authentication, protected APIs, persistence, validation, and audit logging.

### Admin / CMS

The Admin Panel expanded from basic product management into a broader Website Control Center covering products, company information, site content, media, inquiries, SEO, security, backups, and system operations.

### Current Stage

The current implementation is under independent audit; the owner's full pre-deployment requirements are not yet verified complete. Development should now prioritize launch blockers and verified integration issues instead of introducing unnecessary new features.

---

## Remaining Roadmap

### 1. Multi-Agent Governance

Gemini and Codex may both contribute to this repository.

Add and maintain repository-level agent instructions so that every agent:

- Reads latest `main` before working
- Reviews relevant branches/PRs
- Avoids duplicate implementation
- Uses isolated branches for substantial changes
- Reports changed files, tests, assumptions, and commit SHA
- Does not overwrite another agent's active work blindly

### 2. Final Integration Audit

Verify complete flows end-to-end:

**Admin UI → API → Service → SQLite → Public Website**

Priority areas:

- Product CRUD/archive/duplicate
- Company/settings persistence
- CMS persistence
- Media
- Inquiries
- SEO
- Authentication/roles
- Backup/restore
- Audit logs
- System controls
- 68-product integrity

Any visible admin control must either work end-to-end or be removed/disabled before launch.

### 3. Resolve Audited Media Gaps

Physical upload already exists. Replace the 29 corrupt source images using verified files, finish public gallery/alt/PDF consumption, and define an offline storage retention/backup procedure. Do not replace technical photographs with invented or unrelated stock images.

### 4. Final UX & Browser QA

Test:

- Desktop
- Laptop
- Tablet
- Mobile
- Persian RTL
- English LTR
- Public website
- Admin panel
- Forms
- Modals
- Loading/error/empty states
- Accessibility basics

### 5. Production Security & Configuration

Review:

- Production secrets
- Session/cookie configuration
- Reverse proxy settings
- HTTPS
- CSRF/CORS behavior
- Rate limiting
- File/database permissions
- Database persistence
- Backup strategy
- Logging
- Production environment variables

### 6. Deployment Candidate Freeze

Once launch blockers are resolved:

1. Run full build/type/security/integration checks.
2. Freeze feature development.
3. Create a clearly identified deployment-candidate commit/tag.
4. Perform final local audit.

### 7. VPS Deployment

Deploy the frozen candidate and verify:

- Domains
- SSL
- Reverse proxy
- Node process lifecycle
- SQLite persistence
- Static assets
- Admin authentication
- CMS updates
- Product pages
- Contact/inquiry flow
- Backup operation
- Production logs

### 8. Post-Deploy Smoke Test

Perform a final production test before declaring the site live.

---

## README Update Policy

This README is the living project-status document.

After every meaningful milestone, merge, or phase completion, update at least:

1. **Last status review**
2. **Current Project Status**
3. **Progress overview**
4. **Admin / CMS Status** if affected
5. **Remaining Roadmap**
6. Any newly discovered launch blocker

Status indicators:

- ✅ Complete and verified
- 🟢 Implemented / substantially complete
- 🟡 In progress / requires verification
- ⬜ Not started
- 🔴 Blocked / critical issue

Do not mark a feature **Complete** only because UI exists. Completion requires the relevant end-to-end flow to be implemented and verified.

---

## Current Development Rule

> **GitHub `main` is the source of truth.**

Historical prompts, reports, screenshots, and summaries are useful context, but they must not override the current repository state.

Before starting new work:

1. Pull/read latest `main`.
2. Inspect recent commits.
3. Check active branches/PRs.
4. Confirm the feature does not already exist.
5. Preserve product/engineering integrity.
6. Implement only the required scope.
7. Test.
8. Commit with a clear message.
9. Update this README when project status materially changes.

---

## Launch Philosophy

The project is no longer primarily in a feature-building phase.

From this point forward, changes should generally satisfy at least one of these conditions:

- Resolve a launch blocker
- Complete an original business requirement
- Fix an integration/regression issue
- Improve security or production reliability
- Correct verified content/data
- Complete required deployment infrastructure

Unnecessary feature expansion should be deferred until after a stable production launch.
