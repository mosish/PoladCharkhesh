# Polad Charkhesh Industrial Bearings — System Architecture

> Current corrective policies and verification: [Phase 7.0.1](PHASE_7_0_1_INTEGRITY.md). Earlier phase statements below are historical.

**Document Version:** 2.1.0  
**Phase:** 6.2.2 Stabilization & Readiness Complete  
**Engineered For:** Polad Charkhesh Industrial Trading Co. (بازرگانی پولاد چرخِش)

---

## 1. System Overview

Polad Charkhesh is an industrial-grade web application and catalog platform for heavy-industry rotating equipment components (bearings, housings, lubricants, and high-pressure oil seals). The application pairs an ISO 281:2007 $L_{10}$ bearing life engineering calculator with a dynamic, authenticated catalog management system.

```
+-------------------------------------------------------------------------+
|                              Client (Browser)                           |
|  - React 18 + Vite SPA                                                 |
|  - Reactive Data Service (`src/services/dataService.ts`)                 |
|  - Dynamic Hooks (`useCompanyInfo`, catalog state)                      |
|  - ISO 281:2007 $L_{10}$ Calculation Engine (`src/utils/calculations.ts`)|
|  - RTL Persian UI + Lucide Icons + Tailwind CSS                         |
+------------------------------------+------------------------------------+
                                     | HttpOnly Cookie (SameSite=Strict)
                                     | REST API (/api/*)
+------------------------------------v------------------------------------+
|                         Express Backend Server (Node.js)                |
|  - Server: `server.ts` & Modular Route Handlers in `server/routes/`     |
|  - Authentication & Session Subsystem (`server/auth.ts`)                 |
|  - Security & Audit Middleware (`server/middleware.ts`)                 |
|  - Transactional SQLite Manager (`server/db.ts`)                        |
+------------------------------------+------------------------------------+
                                     | Direct File I/O (WAL Mode)
+------------------------------------v------------------------------------+
|                    SQLite Embedded Database Engine                     |
|  - Database: `data/poladcharkhesh.db`                                   |
|  - 10 Tables (Admins, Sessions, 68 Products, CMS, SEO, Inquiries, etc.)|
|  - Atomic Transactions, Foreign Keys, Fast Indexing                     |
+-------------------------------------------------------------------------+
```

---

## 2. Backend Architecture

### 2.1 Server Stack
- **Runtime:** Node.js (with native `node:sqlite` DatabaseSync module)
- **Framework:** Express 5 with JSON body parser, Cookie parser, and Helmet security headers
- **Development & Build Pipeline:** Dev via `tsx server.ts`; Production bundle compiled via `esbuild` to CommonJS (`dist/server.cjs`) with static SPA fallback.

### 2.2 Route Architecture
All API routes are prefixed under `/api/*`:
- `/api/auth`: Login, setup, logout, password change, current admin status (`me`).
- `/api/products`: Public catalog query (with optional archived filter for admins), authenticated CRUD, toggle archive, permanent deletion.
- `/api/company`: Public identity and contact details; authenticated whitelisted updates.
- `/api/content`: Public CMS page content (hero, about, footer, counters); authenticated atomic updates.
- `/api/seo`: Public SEO configuration (meta tags, titles, canonical URL); authenticated updates.
- `/api/inquiries`: Public rate-limited customer inquiry submissions; authenticated status management and audit logs.
- `/api/system`: Health check, audit log viewer, database backup export, transactional restore, and factory reset to 68 canonical products.

---

## 3. Authentication & Security Subsystem

### 3.1 Session Architecture
1. **Password Hashing:** PBKDF2 with 100,000 iterations, 16-byte random cryptographically secure salt (`crypto.randomBytes`), 64-byte digest (SHA-512). Verification uses `crypto.timingSafeEqual` against timing attacks.
2. **Session Storage:** Server-side sessions persisted in the SQLite `sessions` table.
3. **Session Token Issuance:** Issued via an `HttpOnly`, `SameSite=Strict`, `Path=/` cookie. **Tokens are never returned in JSON payloads** (`POST /api/auth/login` and `POST /api/auth/setup` return solely user profile objects).
4. **Session Invalidation:**
   - Explicit `POST /api/auth/logout` sets `is_revoked = 1` in SQLite and clears the cookie.
   - Changing password revokes all other active sessions for that admin while maintaining the current working session.
5. **Rate Limiting & Lockout:**
   - IP-based rate limiting on sensitive routes (e.g., 15 attempts / 5 minutes on login).
   - Consecutive failed logins counter: 5 failed attempts trigger an automatic 5-minute account lockout.
6. **Secret Management:**
   - Mandatory `SESSION_SECRET` and `COOKIE_SECRET` environment variables in production (`NODE_ENV=production`). If missing, the server fails fast immediately on boot with a descriptive error.

---

## 4. Database Schema (SQLite)

Located at `data/poladcharkhesh.db`:
- **Pragmas:** `PRAGMA journal_mode = WAL;`, `PRAGMA synchronous = NORMAL;`, `PRAGMA foreign_keys = ON;`, `PRAGMA busy_timeout = 5000;`.
- **Transactions:** Handled via `runTransaction()` utilizing `BEGIN IMMEDIATE` and `ROLLBACK` on exceptions.

### Table Summary:
1. `admins`: System administrators (ID, unique username, password hash, role, lockout status).
2. `sessions`: Active authentication tokens (ID, admin_id with CASCADE delete, user agent, IP, expiration, revocation).
3. `products`: The catalog of 68 canonical engineering items plus additions. Includes mechanical parameters ($d, D, B$, $C_r, C_{0r}$, grease/oil RPM, ISO calculation factors $e, Y, Y_0, Y_1, Y_2, f_0$, application tags, technical catalog sources).
4. `company_info`: Dynamic organizational identity and official contact info (main record).
5. `cms_content`: Dynamic landing page and promotional content (hero, about, statistics, footer).
6. `seo_config`: Search engine optimization configuration and social cards metadata.
7. `audit_logs`: Immutable traceability table logging administrative actions (timestamp, action, entity, user, IP, metadata).
8. `inquiries`: Customer quotation requests and RFQ submissions (name, phone, message, company, status: new/reviewed/contacted/closed).
9. `media_metadata`: Media library records for technical schematics and product imagery.
10. `backup_snapshots`: Automatic pre-restore and manual JSON snapshots for disaster recovery.

---

## 5. Catalog & Engineering Integrity

### 5.1 68 Canonical Products
The catalog contains exactly **68 canonical engineering products** strictly partitioned across industrial categories:
- **Ball Bearings (18):** Deep Groove (12), Angular Contact (5), Self-Aligning (1).
- **Roller Bearings (30):** Tapered Roller (9), Spherical Roller (10), Cylindrical Roller (7), Needle / Cam Followers (3), CARB Toroidal (1).
- **Thrust Bearings (4):** Ball & Spherical Roller Thrust.
- **Plummer Blocks & Housings (6):** Split Plummer Blocks (SNL) & Pillow Blocks (UCP/UCF).
- **Industrial Lubricants (2):** Mineral and synthetic high-performance greases (SKF LGMT 2, Mobilith SHC 220).
- **Rotary Oil & Hydraulic Seals (8):** NBR, Viton FKM, and high-pressure BABSL rotary shaft seals (Freudenberg / Corteco).

### 5.2 Engineering Calculations ($L_{10}$)
Implemented in `src/utils/calculations.ts` strictly following ISO 281:2007:
- Equivalent Dynamic Radial Load: $P = X \cdot F_r + Y \cdot F_a$
- Basic Rating Life in Million Revolutions: $L_{10} = \left(\frac{C}{P}\right)^p$ (where $p=3$ for ball, $p=\frac{10}{3}$ for roller)
- Life in Operating Hours: $L_{10h} = \frac{10^6}{60 \cdot n} \cdot L_{10}$
- Viscosity ratio $\kappa = \frac{\nu}{\nu_1}$ based on mean diameter $d_m = \frac{d + D}{2}$.

---

## 6. Frontend Architecture & Data Decoupling

- **Decoupled Data Layer:** Frontend components consume `dataService` (`src/services/dataService.ts`) and React hooks (`useCompanyInfo()`) which query backend SQLite endpoints with seamless in-memory fallbacks.
- **No Static Hardcoding:** All pages (Product Page, Spec Modals, 404, SEO metadata generators) obtain live organizational details dynamically from the database.
- **Sitemap Generator:** `scripts/generate-sitemap.mjs` reads catalog entries and builds valid XML sitemaps with 68 canonical URLs.
