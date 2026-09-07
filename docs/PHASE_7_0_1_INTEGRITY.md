# Phase 7.0.1 — Post-Change Integrity Fix

Scope: corrective work only. Phase 7.1 Product Management has not started.
Base: GitHub `mosish/PoladCharkhesh`, commit `12b8bc7`.

## Production authority

Public/Admin UI → frontend API/domain services → Express authorization and validation → domain services → SQLite.

SQLite/backend is authoritative for the live catalog. `src/data/products.ts` is seed/reference/migration material, never a frontend fallback. The client starts with an empty loading state, displays a bilingual retry message on failure, clears previously loaded products after a failed refresh, and accepts an authoritative empty catalog. Quick View and `/product/:slug` remain separate supported paths. A temporarily unavailable product API is not rendered as a missing-product result.

Production startup does not seed an empty database. Development retains the existing first-initialization seed behavior. No catalog seed, patch, reset, migration or technical-data modification was performed on the source database during this phase. Tests copy the source SQLite file to disposable temporary databases; old CRUD/restore tests mutate only those copies.

Company JSON-LD requires successfully fetched company data. Contact numbers, identity, address, city and hours come from that record. Production company reads fail when the record is absent or unparsable. Existing company/CMS client defaults remain bootstrap UI content; they are not used to publish organization structured data before a successful company API response.

## Production secrets and proxy policy

`NODE_ENV=production` requires nonblank `SESSION_SECRET` and `COOKIE_SECRET` in the process environment, before the server listens. Development-only random fallbacks remain. Supply environment variables through the service manager/container; this server does not itself load an `.env` file.

`TRUST_PROXY` defaults to false. The supported opt-in is `TRUST_PROXY=loopback` for a same-host Nginx reverse proxy. Other values do not enable trust. Every IP consumer uses Express `req.ip`, directly or through `getClientIp`, so rate limits, sessions, inquiries and audit records agree.

For the planned same-host Nginx deployment, restrict access to application port 3000 to the proxy and overwrite forwarded headers. Example inside the existing Nginx proxy location:

```nginx
proxy_pass http://127.0.0.1:3000;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

This is deployment guidance, not an installed or tested VPS configuration. Reference: [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/).

## Domain and static SEO policy

Persian content canonicalizes to `https://poladcharkhesh.ir`; English content canonicalizes to `https://poladcharkhesh.com`, including manually switched content. Official `www` hosts have the same defaults. Saved manual language preferences take precedence over defaults. Unknown/localhost hosts default to Persian, but never enter canonical URLs.

Runtime SEO owns localized title/description, canonical, hreflang alternates, Open Graph, Twitter metadata, Product/LocalBusiness JSON-LD and breadcrumbs. `index.html` supplies only a neutral bilingual title and essential head resources: no static canonical, OG tags or organization JSON-LD. No external/fake organization image is emitted. Product images/schema are cleared on navigation. This remains client-rendered SEO; server rendering/prerendering and social crawler validation are not implemented by this corrective phase.

Homepage title/description consume the existing CMS SEO record. Canonical origins are deliberately fixed to the two approved domains; the historical single `canonicalBaseUrl` field remains in the data schema for compatibility, while the admin field displays the applicable approved origin as read-only.

Express serves `/sitemap.xml` and `/robots.txt` before static files. The sitemap reads active products from SQLite and uses the recognized Host only to select an approved origin. It publishes both language alternates, excludes hash-only sections, and returns 503 on database failure. The old `public/sitemap.xml`, `public/robots.txt` and static generator are historical artifacts; the Vite build no longer runs the static generator. Serve this application through Express, not by hosting `dist/` alone.

Persian uses existing IRANSans assets. English prioritizes the already loaded Outfit font. Existing engineering monospace rules are unchanged.

## Reproducible verification

Use Node with `node:sqlite` support and the existing Bun lockfile:

```sh
bun install --frozen-lockfile
bun run test:phase701
bun run lint
bun run build
```

`test:phase701` includes fresh-process production configuration checks, live Express proxy/rate-limit/auth tests, both-domain HTTP sitemap/robots checks, API failure/recovery tests, runtime metadata tests using a minimal DOM adapter, typography and Quick View/ProductPage wiring checks, and both existing Phase 6.2.1/6.2.2 backend suites. Existing ISO 281 benchmarks are run without changing their formulas or expected values. It also verifies the source database hash and both 68-product counts.

Technical manufacturer-data correctness is outside this phase and remains assigned to the separate data-engineering audit. Deployment, credential rotation and final VPS hardening remain planned pre-deployment work, not blockers to continuing development in Phase 7.1.

## Verified result

On 2026-09-08, all 11 regression groups passed, including both prior backend security suites and all 5 unchanged ISO 281 benchmarks. Typecheck and production frontend/backend build passed. A built-server smoke test passed for health, 68-product API, home and direct product routes, both-domain sitemap, JavaScript delivery and the IRANSans asset. The source SQLite file, static 68-product dataset, calculation code, Quick View, ProductPage and homepage engineering component files were unchanged. The Bun lockfile and dependency versions were unchanged.

The remaining build warning concerns the existing large JavaScript chunk. No browser visual interaction test, VPS/Nginx deployment test or manufacturer-data audit is claimed.

**Verdict: READY FOR PHASE 7.1.** Phase 7.1 has not been started.
