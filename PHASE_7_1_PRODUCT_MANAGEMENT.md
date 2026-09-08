# POLAD CHARKHESH — PHASE 7.1: PRODUCT MANAGEMENT & CMS FOUNDATION

## Executive Summary
Phase 7.1 establishes a production-grade, authoritative product management interface in the Polad Charkhesh Admin portal while laying the data architecture for a full-site Content Management System (CMS). All operations respect the strict non-e-commerce industrial identity of Polad Charkhesh, maintaining engineering calculation accuracy, ISO 281/76 standards compliance, and authenticated administrator session security.

---

## Architecture & Data Flow
The architecture adheres strictly to the single-directional data pipeline:
```
Frontend UI (React + Tailwind)
       │
       ▼
Service / API Layer (`productService.ts`, `dataService.ts`)
       │ (Cookie/Session + CSRF Token Header)
       ▼
Express API Gateway (`server/routes/productRoutes.ts`)
       │ (adminAuthMiddleware, strict parameter validation)
       ▼
Domain Validation (`server/validation.ts`)
       │ (Physical invariants: d < D, positive dimensions, ISO bounds)
       ▼
Domain Storage Service (`server/services/productDb.ts`)
       │
       ▼
Authoritative SQLite Database (`server/db.ts`)
```

---

## 1. Database Schema & Migration Strategy
Database migrations were implemented safely in `server/db.ts` using the idempotent `safeAddColumn` helper to ensure non-destructive upgrades without altering or corrupting the existing catalog:

- `speed_reference_type`: `'limiting' | 'thermal' | 'both'` (Default: `'limiting'`)
- `contact_angle`: `TEXT` (e.g. `'40°'`, `'15°'`)
- `calculation_factor_x`: `REAL` (Radial dynamic load factor $X$)
- `keywords`: `TEXT` (JSON array of localized search and SEO keywords)
- Extended compatibility for calculation factors: $e$, $Y$, $Y_0$, $Y_1$, $Y_2$, $f_0$.

---

## 2. Server API Endpoints
All administrative mutation endpoints require authenticated session cookies (`adminAuthMiddleware`):

| Endpoint | Method | Description | Security |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | Retrieve active or all products with ISO factors | Public / Filtered |
| `/api/products/:id` | `GET` | Retrieve single product with full specs | Public |
| `/api/products` | `POST` | Create new standard product | Admin Required |
| `/api/products/:id` | `PUT` | Update full technical specifications | Admin Required |
| `/api/products/:id/archive` | `PATCH`| Toggle archive status | Admin Required |
| `/api/products/:id/featured` | `PATCH`| 1-click toggle for Featured status | Admin Required |
| `/api/products/:id/stock` | `PATCH`| 1-click toggle between In-Stock & Inquiry | Admin Required |
| `/api/products/:id/duplicate`| `POST` | Clone product with unique designation code | Admin Required |
| `/api/products/:id` | `DELETE` | Permanent product deletion with cascade safety | Admin Required |

---

## 3. Engineering Validation & Physical Invariants
Enforced in `server/validation.ts` and client-side in `ProductFormModal.tsx`:
1. **Physical Impossibility Prevention**: Outer diameter $D$ must strictly exceed inner bore $d$ ($D > d$).
2. **Dimension Sign Bounds**: $d, D, B, Cr, C0r, \text{weight}$ must be strictly positive non-zero numbers.
3. **ISO Load Ratio Checks**: Basic static load rating $C_{0r}$ and dynamic load rating $C_r$ validated against plausible engineering limits.
4. **Thermal vs. Limiting Speed Validation**: Clarifies whether rated RPM reflects limiting boundary lubrication or thermal equilibrium under ISO 15312.

---

## 4. Admin UI Enhancements

### 4.1 Product Form Modal (`ProductFormModal.tsx`)
Organized across six focused engineering tabs:
1. **Identity & Classification**: Code designation, category, bilingual titles and descriptions, stock and featured flags.
2. **Dimensions & Ratings (ISO 281)**: $d, D, B$, weight, $C_r, C_{0r}$, grease and oil RPM, thermal speed rating, reference type, chamfer $r_{min}$, cage material, sealing.
3. **Calculation Factors & Geometry**: ISO factors $e, Y, Y_0, Y_1, Y_2, X, f_0$, contact angle, radial internal clearance classes (Normal, C2, C3, C4, C5), 3D CAD schematic representation.
4. **Media & Gallery**: Multi-image gallery with reordering, primary image assignment, and technical PDF datasheet link.
5. **Brands & Applications**: Supported international brands (SKF, TIMKEN, FAG, NSK, NTN, etc.) and industrial applications (mining, gearboxes, steel rolling).
6. **SEO & Technical Sources**: Manufacturer catalog provenance verification badge, meta title, meta description, and search keywords.

### 4.2 Admin Products Table (`AdminProducts.tsx`)
- **1-Click Featured Toggle**: Clickable star to promote bearings directly from the table.
- **1-Click Stock Status Toggle**: Instant toggle between "In Stock" and "Inquiry" status.
- **Duplicate Action Button**: Seamless 1-click duplication that creates an engineering clone with an appended suffix.
- **Live Search & Filtering**: Multi-criteria filtering by code, category, brand, and archive status.

---

## 5. Security & Invariant Adherence
- **Authoritative Backend**: SQLite remains the authoritative source of truth.
- **Zero Mock Fallbacks on Auth**: Admin operations fail safely if unauthenticated.
- **Non-E-Commerce Protection**: Strictly no shopping cart, consumer prices, or checkout interfaces introduced.
- **Catalog Integrity**: Existing standard bearings catalog preserved intact.
