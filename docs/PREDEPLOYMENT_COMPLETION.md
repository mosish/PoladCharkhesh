# Final pre-deployment completion

Base: main at 6e2a813b568b4829a38a6799437502ff7804fbe2.
Branch: codex/predeployment-completion. No deployment or merge is part of this change.

## Content ownership

| Public area | Editable authority |
| --- | --- |
| Navigation labels | CMS → Navigation |
| Company identity (including logo text), announcement, phones, hours, addresses, WhatsApp | Existing Company/Website Settings |
| Hero headings, introduction, search copy, statistics, brands | CMS → Hero / Brands |
| About paragraphs, mission, vision, benefits and statistics | CMS → About |
| Catalog introduction | CMS → Catalog introduction |
| Engineering tools introduction | CMS → Engineering introduction |
| Why choose us headings and cards | CMS → Why choose us |
| Industry headings and ordered cards / related codes | CMS → Industries introduction / Industry cards |
| Team headings, ordered members, photos, roles, contacts | CMS → Team introduction / Team members |
| Contact introduction, consultation copy and inquiry form copy | CMS → Contact & inquiry copy |
| Footer description, certification copy, copyright, disclaimer and popular codes | CMS → Footer |
| Product details, specifications, applications, availability, sources | Product domain |
| Product galleries and attached PDF | Product domain through Media Library |
| Search metadata and canonical domains | Existing SEO settings; domain rules retained |

Engineering standards, formulas, technical reference tables, geometric rendering and functional UI labels remain code-owned. No technical product data was moved into general CMS.

New editorial fields are initialized from existing FA/EN copy. Existing saved content and intentionally empty translations are preserved. No automatic translation is performed. A missing translation remains empty and is counted in the editor's coverage display.

Content is fetched and saved through the existing SQLite-backed API. The editor waits for the server, preserves failed edits, guards unsaved navigation, and uses a revision to reject stale concurrent saves. Backend validation permits known plain-text fields and bounded arrays only. No HTML is injected.

## Media operations

- Upload JPEG, PNG, WebP or PDF (up to 10 MB), or register a local/HTTPS asset URL.
- Actual upload byte signatures are checked; SVG/HTML and executable URL schemes are not accepted.
- The library indexes existing product assets without rewriting product records.
- Edit filename, category and independent Persian/English alt text.
- Search filename, URL, alt text or associated product code; filter images/PDFs, archive, no product association or missing alt text.
- Attach, detach, reorder and set primary image. The first gallery image is primary.
- Attach/replace or detach the product's PDF without removing the previous file from the library.
- Every gallery mutation compares the current gallery version and executes in a SQLite transaction.
- Archive/restore metadata. Referenced assets cannot be archived. Physical files are retained.
- Quick View and ProductPage render the ordered gallery, configured image alt text and attached PDF, while retaining CAD and generated specification exports.

Remote URLs are registered without server-side fetching. Availability of externally hosted URLs remains controlled by their host. Unknown sizes on legacy/remote assets are displayed as unknown.

Uploads are stored in an uploads directory next to DATABASE_PATH and served under /uploads. PDF responses are attachments; upload responses use nosniff and restrictive CSP. JSON backups now include media metadata. Restore keeps assets absent from an old backup and records a full safety snapshot. **Back up the SQLite database and uploads directory together**; JSON backup does not embed binary files.

## Visual and operational changes

Existing blue/gold identity, logo and functionality remain. Shared styles improve surface contrast, section rhythm, Persian line height, focus visibility, reduced motion and responsive admin forms. CMS and Media Library have consistent headings, grouped fields, filters, empty/error/saving states and mobile layouts.

Catalog cards expose both Quick View and ProductPage. Out-of-stock cards display inquiry status. Quick View traps keyboard focus, closes with Escape and restores focus. Contact inquiry success now waits for the server response.

## Verification

Run with Node 22:

    npm install
    npm run lint
    npm run build
    npm run test:predeployment
    npx playwright install chromium
    npm run test:browser

The integration suite uses a new temporary SQLite database. It covers migration preservation, bilingual blanks, malformed payloads, stale-save conflicts, gallery ordering, primary-image preservation, PDF associations, archive/restore, metadata backup, uploads, protected HTTP endpoints and unchanged engineering values.

The browser suite launches the production build against an isolated temporary database. It exercises Quick View/ProductPage, actual CMS saves, actual media upload/metadata/association/primary actions, English/Persian desktop/mobile rendering and horizontal-overflow checks. Screenshots and failure diagnostics are retained by GitHub Actions.

CI workflow: .github/workflows/predeployment.yml. Consult the PR's latest run for actual results; an earlier successful run does not certify a later commit.

## Existing asset issue requiring original photos before launch

Visual QA found all 29 catalog WebP files already corrupted on the base branch. The first repository commit also contains the corrupted bytes, so Git history cannot recover an authentic original for the sampled file. The browser suite writes `test-results/asset-health.json` with per-file decode results and emits a separate baseline-asset warning. A green functional test run is **not** a clean asset audit.

Original files and product associations are retained. Public galleries keep CAD and show a localized unavailable-image state; the Media Library now shows an explicit thumbnail failure instead of a broken image icon. Replace failed files using approved originals: upload, attach to the appropriate product, set primary/reorder, then detach the old reference. The new library supports this without deleting originals or changing engineering data. No substitute technical photography was invented.
