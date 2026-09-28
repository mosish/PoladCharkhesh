# Polad Charkhesh — پولاد چرخش

> **Project status:** Final integration & launch-readiness stage  
> **Source of truth:** `main` branch  
> **Last status review:** 2026-09-28

Polad Charkhesh is a bilingual Persian/English B2B industrial engineering website focused on bearings, mechanical components, technical product information, engineering tools, datasheets, and direct consultation.

This project is **not an e-commerce website**. There is no online pricing, shopping cart, checkout, payment gateway, or Buy Now flow. The intended journey is:

**Discover Product → Review Technical Data → Use Engineering Information → Review Datasheet → Contact Polad Charkhesh**

---

## Current Project Status

The project has moved beyond the main feature-development phase and is now primarily in:

**Stabilize → Audit → Fix → Freeze → Deploy**

### Progress overview

| Area | Status |
|---|---|
| Core website & industrial design system | ✅ Complete |
| Responsive Persian/English public website | ✅ Complete |
| Product catalog (68 canonical products) | ✅ Complete |
| Engineering product data & calculations | ✅ Complete |
| Product detail experience | ✅ Complete / final QA |
| Express + SQLite backend | ✅ Complete |
| Server-side admin authentication | ✅ Complete |
| Product management | ✅ Complete |
| Company & contact settings | ✅ Complete |
| Full-site content CMS | 🟢 Substantially complete |
| Repeatable public sections | 🟢 Substantially complete |
| Customer inquiries | ✅ Complete |
| SEO management | ✅ Complete |
| Backup / restore | 🟢 Implemented / final integration QA |
| Audit logs | ✅ Complete |
| Media Library | 🟢 Implemented; physical file workflow needs final decision |
| Admin responsive UX | 🟢 Complete / final QA |
| Multi-agent development governance | 🟡 Pending |
| Final integration/regression audit | 🟡 Pending |
| Cross-browser/device QA | 🟡 Pending |
| Production security/configuration audit | 🟡 Pending |
| Deployment candidate freeze | ⬜ Pending |
| VPS deployment | ⬜ Pending |
| Production smoke test | ⬜ Pending |

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
- Mobile and landline numbers
- WhatsApp
- Email/contact information
- Structured working hours
- Global website settings
- CTA/contact visibility
- Site-wide communication settings

Public website components should consume this centralized source instead of duplicating contact data.

### Full-Site CMS

CMS coverage has been expanded across major public sections, including:

- Hero
- About
- Catalog headings/content
- Engineering Tools headings/content
- Benefits / Why Us
- Industries
- Team
- Contact
- Footer
- Other shared public content

The goal remains that routine website content changes should be possible from Admin without editing source code.

### Customer Inquiries

Website inquiries are stored and manageable from Admin.

Supported workflow:

**New → Reviewed → Contacted → Closed**

Admins can search/filter inquiries and track customer follow-up.

### Media Library

The Media module currently supports:

- Media records and metadata
- Search and category filtering
- Persian/English alt text
- Product associations
- Product gallery management
- Image ordering / primary image
- Datasheet URL association

**Launch-readiness note:** the current workflow includes metadata/URL management. The final project audit should confirm whether direct physical file upload/storage/delete is required before production deployment.

### Backup, Security & Audit

Admin/System functionality includes:

- Password management
- Dataset/database backup export
- Backup restore
- Audit logging
- Security/system management

Media and inquiry data have also been integrated into the backup/restore direction.

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

- **Vazirmatn** — Persian
- **Inter** — English
- **IBM Plex Mono** — technical codes / part numbers

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

Major feature development is substantially complete. Development should now prioritize launch blockers and verified integration issues instead of introducing unnecessary new features.

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

### 3. Media Workflow Decision

Confirm whether production requires direct image/PDF upload and physical storage management.

If required, complete it **before deployment**.

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
