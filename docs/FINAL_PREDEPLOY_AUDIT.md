# Independent pre-deployment audit — 2026-09-28

## AGENT

ChatGPT / Codex

## ROLE

Independent Auditor / Reviewer / Fixer. This is a bounded audit and defect-fix PR, not another feature phase. No deployment or merge was performed.

## BASE COMMIT

`9221340e3c4c9ef52f401c9758521ccf78e8ba10` — current main when the audit started and at the final remote recheck.

## AUDITED GEMINI COMMIT

`9221340e3c4c9ef52f401c9758521ccf78e8ba10` (physical media upload), together with `86bcaddc7da4ca7b931d4d14739319f79ae451ce` (CMS/admin completion) and `a80dbd47034b83224cc818cbc96bd206a6b064ce` (README). “Gemini” is the user's attribution; commit metadata does not independently establish which model wrote code.

| Recent change | Result | Evidence |
|---|---|---|
| Physical image/PDF upload | PARTIAL | Actual authenticated upload, MIME spoof rejection, size rejection, serving and restart tests pass. Unsafe deletion/identity handling fixed; public consumption remains incomplete. |
| Expanded nine-section CMS | PARTIAL | API persistence and bilingual public marker tests pass after restart. Ignored Hero/About/Footer fields fixed. Hardcoded copy and incomplete bilingual editors remain. |
| Inquiries, settings, admin operation | PARTIAL | Roles, persistence, record handling and eight module routes exercised. Not every visible control has an end-to-end UI test. |
| “Complete / verified / ready for freeze” README claims | FAIL | Catalog reconciliation and image decoding fail; full CMS/media coverage and cross-browser certification are absent. |

## BRANCH

`codex/final-predeploy-audit`

Before edits, reviewed README, main history, recent Gemini/Codex branches and open PRs #1, #5 and #6. Compared both `phase-7.3-final-predeploy-rebased` and `codex/predeployment-completion` to main. They overlap CMS, media, admin, validation and service files. This branch starts at current main and does not merge their incompatible schemas or overwrite their branches. Final fetch still resolved main to the base above; no incoming semantic merge was required.

## P0 — DEPLOYMENT BLOCKERS

1. **Unresolved SQLite/reference engineering reconciliation.** Both sources contain 68 unique products, but comparison found **142 differing fields across 62 products: 50 code case differences and 92 numeric/presence differences**. Examples: 6204 oil speed 17,000 vs 19,000; UCP205 `D` 140 vs 71; SNL511-609 `Cr/C0r` 160/190 vs 190/160; missing calculation factors for several angular-contact/double-row products. [Every difference is recorded](audit-evidence/engineering-differences.json). This establishes disagreement, not that either source is automatically correct. Runtime SQLite remains authoritative. Manufacturer evidence and the history of intentional admin overrides must decide resolution. Factory Reset would replace live values with the reference set; do not use it operationally until reconciled.

## P1 — BEFORE LAUNCH

1. **29 corrupt local catalog images fail actual Chrome decoding.** [Exact paths](audit-evidence/image-audit.json). No source photo was replaced or generated. The misleading unrelated stock-photo fallback was removed. Restore verified original assets.
2. **Media public integration is incomplete.** `PartMediaSlider` still renders CAD + one primary photo; saved gallery order and media FA/EN alt text are not consumed. ProductPage/Quick View do not expose associated `pdfUrl` documents; generated specification PDF remains available. `associatedProductCodes` metadata alone does not attach an asset. Upload signature checks are not full image/PDF structural decoding, so corrupt files with plausible headers can still enter the library.
3. **Full CMS and bilingual editor coverage is incomplete.** Hero statistics, About mission/vision/features, certification/guarantee copy and other strings remain in translations/components. Repeatable lists still require JSON. Some Hero/About English fields and SEO English fields are not exposed by the current forms, despite being represented in the API. This does not satisfy the owner's requirement to manage all normal content without code.
4. **Unverified business claims/values remain.** Runtime defaults include `info@poladcharkhesh.ir`, map coordinates `35.7335,51.5125`, generic Neshan/Balad destinations, 25+ years, 15,000+ stocked numbers, 100% authenticity/certificate claims and 24-hour dispatch. Confirm or remove through an owner-approved content pass; no replacement facts were invented. The invented postal fallback was removed. Static demo team entries still exist in translations but the current CMS default roster is empty and the public section hides it; do not activate unverified identities.
5. **Product state/SEO controls do not all reach public rendering.** Catalog cards always display the translated in-stock badge even if `inStock` is false. Product-specific `metaTitle*` / `metaDescription*` fields are not used by `updateDocumentSeo`. Site-level saved title/description/keywords/image now do render. The sitemap generator only recognizes single-quoted `slug:` while products use JSON-style keys; build warns and leaves the old sitemap, which also cannot reflect SQLite archive/add changes.
6. **Incomplete final operational verification.** Chrome desktop/mobile representative checks are evidence, not Safari/Firefox, assistive-technology, every-control or deployed HTTPS testing. Existing Overview “100% HEALTHY / verified dimensions” messaging measures basic dataset sanity, not the engineering reconciliation above. The initial admin must be provisioned before public access; strong random secrets, target-host proxy/TLS and persistent-storage backup remain operator requirements.

## P2 — POST-LAUNCH

- Large frontend bundle warning (~1.36 MB uncompressed entry chunk); code splitting can follow blocker resolution.
- Offline storage retention/garbage collection: deleted metadata deliberately leaves uploaded bytes recoverable. No automatic physical purge was added.
- In-memory IP limiter bucket cleanup and broader optimistic concurrency/unsaved-change handling merit follow-up. No claim of exhaustive security certification is made.

## FIXES APPLIED

- Reject malformed/nested/unknown CMS fields and incomplete repeatable items; bound strings/lists and preserve explicit bilingual blanks. Validate SEO scalar/list types and company nested types/links. Safe media/product asset URLs reject executable schemes and ambiguous upload paths.
- Validate every backup business domain before mutation, reject duplicate identities, preserve optional legacy domains, sanitize accepted company/SEO/CMS input, and retain transactional rollback. Factory Reset now records a complete pre-reset business snapshot; snapshot IDs use UUIDs.
- Make media file identity immutable, reject duplicate registration, validate gallery URLs/type/positions and require an existing image for primary/reorder. Reference checks compare normalized local identities and consider duplicate metadata.
- **Deletion policy correction:** remove unreferenced metadata, retain physical files for old exports and safety snapshots. The prior implementation could permanently break a recoverable backup by unlinking its bytes. No filesystem cleanup runs. Upload metadata failure removes only the newly written file.
- Isolate served PDFs with attachment disposition, CSP sandbox and nosniff. Return bounded JSON parser/size errors and API 404s. Missing upload/assets no longer fall through to HTML.
- Honor HOST/PORT, default production to loopback, fail startup if database initialization fails, and fix SPA `sendFile` under dotted parent directories. Correct `.env.example` database path and explicit environment-loading instructions.
- Recheck first-admin provisioning after password hashing and rate-limit setup; simultaneous setup test admits exactly one account. Do not invent an email for a new administrator.
- Preserve initial admin subroute across authentication/loading. Production public rendering waits for all four authoritative product/company/CMS/SEO APIs instead of silently presenting seed content when one fails.
- Render persisted Hero description, About statistics, Footer copyright/disclaimer and site SEO values. Remove invented schema postal fallback and unrelated image-error stock photograph.
- Fix Media PDF clearing (send an explicit empty value) and preserve primary image when loading a gallery. Explain non-destructive metadata deletion.
- Prevent CMS success/save while any JSON list is invalid; avoid unrelated subscription refresh overwriting an edited draft; expose English Footer fields; wrap narrow-screen CMS tabs.
- Extract unchanged defaults into a shared data module, eliminating the backend import of the browser store and associated `import.meta` build warnings.
- Isolate mutating scripts even when invoked directly; fix Windows-incompatible security test invocation, obsolete product category/delete expectations, and validation/deletion contract tests. Keep reconciliation/image checks failing on unresolved assets/data.

## ADMIN AUDIT

| Module | Result | Trace / limits |
|---|---|---|
| Overview | PARTIAL | Counts, audit service, navigation and backup source traced; health wording does not certify manufacturer data. |
| Products | PARTIAL | CRUD/archive/restore/duplicate integrity suites pass; anon archived visibility and delete permissions checked; stock/media/SEO public gaps remain. |
| Media | PARTIAL | UI/service/API/SQLite upload and metadata path traced, real bytes survive restart, refs block removal; public gallery/alt/PDF gaps remain. |
| Inquiries | PARTIAL | Submission, SQLite record, backup roundtrip and triage route/service traced; list/filter UI rendered; every status transition was not browser-clicked. |
| Settings | PARTIAL | Company API persistence and negative validation tested; UI source traced; unverified values and all toggle outcomes need owner/content review. |
| CMS Content | PARTIAL | Nine sections FA/EN saved/read/restarted/rendered. English Footer UI save and invalid JSON save block exercised. Coverage gaps remain. |
| SEO | PARTIAL | Saved site metadata renders after restart; canonical domains remain fixed. Product overrides, English form coverage and sitemap incomplete. |
| Security/System | PARTIAL | Roles, cookies, password/session lifecycle, backup/reset safeguards pass isolated tests. Initial provisioning and target deployment conditions remain unverified. |

## PRODUCT INTEGRITY

- Expected: **68**. Actual: **68 bundled + 68 SQLite**, all active in the audited seed.
- Duplicates: **0** IDs, codes and slugs in each audited catalog. Anonymous API returns active products; temporarily archived records are excluded from both list and direct detail.
- Engineering regression: existing static audit executes 58 rolling-bearing calculations plus 10 seal/lubricant exclusions; five ISO 281 benchmarks pass (<0.5% tolerance). **These do not reconcile SQLite against manufacturers.** The independent cross-source check fails with the recorded 142 differences.
- Technical data modified: **NONE**. Engineering formulas, reference product file and tracked SQLite are unchanged.
- Tracked SQLite blob before/after: `9e2213f5b533840f73bd21338ec0b748aa21b9b3`.

## CMS AUTHORITY

**PARTIAL.** Hero, About, Benefits, Industries, Team, Catalog, Tools, Contact and Footer bilingual marker edits persisted, survived a real production-process restart and appeared publicly. Empty translations remain empty through API validation/storage. Legacy missing sections merge defaults on read; no destructive content reseeding was introduced. Team test identities existed only in isolated temporary databases. Public production now fails visibly if a required authority API fails. Existing model coverage/editor gaps are listed above; passing representative markers does not certify every field.

## COMPANY DATA HYGIENE

Verified owner facts: `09127195313`, `09126172282`, `02177209117`, `02133939482`; No. 433, Dardasht St, Narmak, Tehran, Iran; general hours 08:00–16:00. Existing company service and contact components were traced against these. Specific working days/Thursday schedule, email ownership, map point, marketing statistics and certificate claims were not supplied as verified facts. No new business values were guessed.

## MEDIA

**PARTIAL.** Physical upload: **YES**, authenticated JPEG/PNG/WebP/PDF with 10 MB limit, signature check and generated UUID filenames. Persistent storage: **YES**, adjacent to configured SQLite; uploaded PDF and metadata survived restart. Safe deletion: **PASS for tested current-reference/identity cases**, metadata-only and recoverable bytes retained. Reference integrity: **PARTIAL overall**, because public consumption and historical aliases/unregistered files are not fully reconciled. JSON backups do not embed file bytes; back up the uploads directory separately. Serving uses actual production middleware; PDF headers were checked. Existing 29 files cannot decode.

## SECURITY

**PARTIAL overall.** Tested anonymous denials, editor/superadmin distinctions, active-product delete prevention, session token exclusion from JSON, HttpOnly/Secure/SameSite=Strict production flags, password change revoking other sessions, logout, setup race, upload spoof/size rejection, malformed payload rejection, forbidden keys and backup/reset roles. Missing secrets fail startup. No permissive CORS middleware is installed; SameSite=Strict is the primary cross-site cookie defense, not an independent CSRF token. Credentials and session secrets are absent from exported business snapshots. Strong secrets and a correct trusted-proxy boundary are still required; short non-placeholder secrets are not entropy-validated by the existing config. No penetration-test or actual HTTPS guarantee is implied.

## PRODUCTION READINESS

**FAIL for candidate freeze.** Built production backend was executed on loopback with a copied database. Tests exercised startup failure, configured port, public/API routing, direct ProductPage, cookie flags, upload limits/serving, restart persistence and authoritative-outage behavior. Browser: installed Chrome, FA/EN, 390px and 1440px, public and representative Admin; no horizontal viewport overflow or uncaught page exceptions in tested flows. Playwright's browser download was unavailable (HTTP 403); installed Chrome was used successfully. No VPS, DNS, Nginx, SSL or public deployment was touched.

## TESTS

Executed on Windows, Node **24.19.0**. Every mutating test used a disposable copied database; the tracked seed hash is unchanged. `test-results/` contains local logs/screenshots and is ignored. [Browser result summary](audit-evidence/production-audit.json) is committed.

| Exact command | Result |
|---|---|
| `npm.cmd install --no-audit --no-fund` | PASS; no dependency versions intentionally changed. |
| `npm.cmd run lint` | PASS (`tsc --noEmit`). |
| `npm.cmd run build` | PASS frontend + backend; large chunk and stale sitemap warnings remain. |
| `node scripts/runIsolated.mjs scripts/verifyCatalog.ts scripts/auditCalculations.ts scripts/verifyPhase720.ts scripts/verifyPhase701Integrity.ts server/scripts/testBackend.ts server/scripts/verifyPhase622.ts scripts/verifyMediaAndLaunchIntegrity.ts` | PASS all seven scripts; 41 Phase720 assertions, 45 Phase701 assertions, security/backup/media checks, 68 static products, five engineering benchmarks. |
| `node scripts/runIsolated.mjs scripts/auditFinalPredeploy.ts` | **FAIL intentionally visible:** 14 checks pass, 1 reconciliation check fails (142 field differences). No test was skipped or changed to hide these discrepancies. |
| `node scripts/auditProduction.mjs` with `PLAYWRIGHT_MODULE_PATH` pointing to bundled Playwright and `PLAYWRIGHT_CHANNEL=chrome` | **FAIL intentionally visible:** 25 checks pass, 1 image-decoding check fails (29 files). |
| `git diff --check` | PASS. |
| `git fetch origin` and `git log -1 origin/main` | Main unchanged at `9221340…`; no concurrent changes merged. |

Baseline failures were reproduced before fixes: malformed CMS/SEO/media accepted, unsafe gallery input, invalid restore returning 500, no pre-reset snapshot, Windows security test invocation failure. Additional targeted reproduction confirmed malformed company types. Browser checks subsequently found the dotted-path SPA failure and admin deep-link reset; both now pass. During test development, wrong selectors briefly reported failures; corrected selectors exercise visible headings, the product card title and the actual JSON textarea. Final results above supersede those intermediate harness failures.

## README AUDIT

Accurate before audit: **NO**. Updated: **YES**. Removed unsupported complete/ready/cross-browser claims, documented partial coverage, actual fonts, storage deletion/backup semantics, environment loading and unresolved warnings.

## FILES CHANGED

No synced `sources/` reference file was modified.

- `.env.example`
- `.gitignore`
- `README.md`
- `docs/FINAL_PREDEPLOY_AUDIT.md`
- `docs/audit-evidence/engineering-differences.json`
- `docs/audit-evidence/image-audit.json`
- `docs/audit-evidence/production-audit.json`
- `scripts/auditFinalPredeploy.ts`
- `scripts/auditProduction.mjs`
- `scripts/runIsolated.mjs`
- `scripts/testDatabase.ts`
- `scripts/verifyMediaAndLaunchIntegrity.ts`
- `scripts/verifyPhase701Integrity.ts`
- `scripts/verifyPhase720.ts`
- `server.ts`
- `server/assetUrls.ts`
- `server/config.ts`
- `server/routes/authRoutes.ts`
- `server/routes/mediaRoutes.ts`
- `server/routes/systemRoutes.ts`
- `server/scripts/testBackend.ts`
- `server/scripts/verifyPhase622.ts`
- `server/services/contentDb.ts`
- `server/services/mediaDb.ts`
- `server/services/seoDb.ts`
- `server/services/systemDb.ts`
- `server/snapshotValidation.ts`
- `server/validation.ts`
- `src/App.tsx`
- `src/components/AboutUs.tsx`
- `src/components/Footer.tsx`
- `src/components/Hero.tsx`
- `src/components/PartMediaSlider.tsx`
- `src/components/admin/AdminContent.tsx`
- `src/components/admin/AdminMedia.tsx`
- `src/data/cmsDefaults.ts`
- `src/services/dataService.ts`
- `src/utils/seo.ts`

## GIT

Implementation commit: `b100571372c4ba2402883806645d9337d70a1642` — `fix: harden audited predeploy paths and document remaining blockers`.
Final follow-up commit message: `chore: finalize audit evidence and whitespace`. This follow-up only trims trailing blank lines and records the implementation commit; runtime behavior is unchanged.
The immutable final commit SHA is reported in the PR and completion message (a commit cannot contain its own SHA). Base and final main recheck are recorded above. No force-push, merge, deployment or unrelated branch modification.

## FINAL VERDICT

**NOT READY FOR DEPLOYMENT CANDIDATE FREEZE**

## REQUIRED NEXT ACTION

Reconcile and approve the recorded SQLite/reference engineering differences against manufacturer evidence and intentional admin history before choosing a deployment candidate; do not bulk-normalize or reset the catalog to make the audit green.
