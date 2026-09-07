import { validateAndLoadConfig } from '../server/config';
import { getClientIp } from '../server/middleware';
import { getAuthoritativeDomain, resolveAbsoluteSeoUrl } from '../src/utils/seo';
import { COMPANY_INFO } from '../src/data/company';
import { bearingProducts } from '../src/data/products';
import { getDatabase } from '../server/db';
import { hashPassword, verifyPassword } from '../server/auth';
import { calculateBearingLife, calculateEquivalentLoads } from '../src/utils/bearingCalculations';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function runIntegrityAudit() {
  console.log('=====================================================');
  console.log('PHASE 7.0.1 - POST-CHANGE INTEGRITY VERIFICATION SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // ITEM 1: PRODUCTION SECRET FAIL-FAST
  // ----------------------------------------------------
  console.log('--- 1. Testing Production Secret Fail-Fast ---');
  try {
    validateAndLoadConfig({ NODE_ENV: 'production' });
    assert(false, 'Production config must reject missing SESSION_SECRET & COOKIE_SECRET');
  } catch (err: any) {
    assert(
      err.message.includes('SESSION_SECRET') && err.message.includes('COOKIE_SECRET'),
      'Production config throws fatal error on missing secrets',
      err.message
    );
  }

  try {
    validateAndLoadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'some-valid-strong-session-secret-min32-chars-long',
    });
    assert(false, 'Production config must reject when COOKIE_SECRET is missing');
  } catch (err: any) {
    assert(err.message.includes('COOKIE_SECRET'), 'Production config throws on missing COOKIE_SECRET');
  }

  try {
    validateAndLoadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'secret',
      COOKIE_SECRET: 'changeme',
    });
    assert(false, 'Production config must reject trivial/insecure secrets');
  } catch (err: any) {
    assert(err.message.includes('trivial or default'), 'Production config rejects trivial default secrets');
  }

  try {
    const validProdConfig = validateAndLoadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: '4f8b2c1d9e7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e',
      COOKIE_SECRET: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    });
    assert(validProdConfig.isProduction === true, 'Production config succeeds when secrets are explicitly set');
    assert(validProdConfig.TRUST_PROXY === 1, 'Production config defaults TRUST_PROXY to 1');
  } catch (err: any) {
    assert(false, 'Valid production secrets threw unexpectedly', err.message);
  }

  // Development fallback
  const devConfig = validateAndLoadConfig({ NODE_ENV: 'development' });
  assert(
    devConfig.isProduction === false && devConfig.SESSION_SECRET.length >= 32,
    'Development environment uses documented safe local fallback'
  );

  // ----------------------------------------------------
  // ITEM 2: TRUSTED CLIENT IP HANDLING
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Trusted Client IP Handling ---');
  const mockReqDirect = {
    ip: '198.51.100.25',
    socket: { remoteAddress: '198.51.100.25' },
    headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
  } as any;
  const resolvedDirect = getClientIp(mockReqDirect);
  assert(resolvedDirect === '198.51.100.25', 'Direct request uses Express validated req.ip, ignoring spoofed x-forwarded-for');

  const mockReqIpv6 = {
    ip: '::ffff:203.0.113.195',
    socket: { remoteAddress: '::ffff:203.0.113.195' },
    headers: {},
  } as any;
  assert(getClientIp(mockReqIpv6) === '203.0.113.195', 'IPv6-mapped IPv4 addresses normalized');

  // ----------------------------------------------------
  // ITEM 3: .IR / .COM SEO DOMAIN FOUNDATION
  // ----------------------------------------------------
  console.log('\n--- 3. Testing .ir / .com SEO Foundation ---');
  const faDomain = getAuthoritativeDomain('fa');
  const enDomain = getAuthoritativeDomain('en');
  assert(faDomain === 'https://poladcharkhesh.ir', 'Persian domain resolves to https://poladcharkhesh.ir');
  assert(enDomain === 'https://poladcharkhesh.com', 'English domain resolves to https://poladcharkhesh.com');

  const faProductUrl = resolveAbsoluteSeoUrl('/product/skf-6204-2rs', 'fa');
  const enProductUrl = resolveAbsoluteSeoUrl('/product/skf-6204-2rs', 'en');
  assert(faProductUrl === 'https://poladcharkhesh.ir/product/skf-6204-2rs', 'Persian canonical product URL uses .ir');
  assert(enProductUrl === 'https://poladcharkhesh.com/product/skf-6204-2rs', 'English canonical product URL uses .com');

  // ----------------------------------------------------
  // ITEM 4: REMOVAL OF DUPLICATED CONTACT DATA & STATIC AUDIT
  // ----------------------------------------------------
  console.log('\n--- 4. Testing SEO Contact Data Source & index.html ---');
  assert(Boolean(COMPANY_INFO.primaryPhone && COMPANY_INFO.landlinePhone), 'Authoritative COMPANY_INFO exists and has phone numbers');

  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
  assert(!indexHtml.includes('unsplash.com'), 'index.html contains NO external unsplash image placeholders');
  assert(indexHtml.includes('hreflang="fa-IR"') && indexHtml.includes('hreflang="en"') && indexHtml.includes('hreflang="x-default"'), 'index.html includes dual-domain hreflang tags');
  assert(indexHtml.includes('https://poladcharkhesh.ir'), 'index.html contains canonical .ir URL');

  // ----------------------------------------------------
  // ITEM 5: STATIC FALLBACK POLICY & SQLITE AUTHORITATIVE CATALOG
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Static Fallback Policy & SQLite Catalog (68 products) ---');
  const db = getDatabase();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products;').get() as { count: number | bigint };
  const dbCount = Number(countRow.count);
  assert(dbCount === 68, `SQLite database contains EXACTLY 68 products (found ${dbCount})`);
  assert(bearingProducts.length === 68, `Canonical products dataset contains EXACTLY 68 products (found ${bearingProducts.length})`);

  // Verify technical integrity of records in DB
  const sampleCanonical = bearingProducts.slice(0, 10);
  for (const canonical of sampleCanonical) {
    const row = db.prepare('SELECT code, d_inner, d_outer, b_width, cr_kn, cor_kn, speed_grease_rpm, technical_sources FROM products WHERE id = ?;').get(canonical.id) as any;
    assert(Boolean(row), `Product ${canonical.code} exists in SQLite`);
    if (row) {
      assert(
        Math.abs(row.d_inner - canonical.d) < 0.01 &&
        Math.abs(row.cr_kn - canonical.crKn) < 0.01 &&
        Math.abs(row.cor_kn - canonical.corKn) < 0.01,
        `Technical values for ${canonical.code} match exactly (d=${row.d_inner}, Cr=${row.cr_kn}, Cor=${row.cor_kn})`
      );
    }
  }

  // ----------------------------------------------------
  // ITEM 6: TYPOGRAPHY FONT-STACK AUDIT
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Typography Font-Stack Strategy ---');
  const indexCss = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf-8');
  const enFontMatch = indexCss.match(/html\[lang="en"\]\s*\{[^}]+font-family:\s*([^;]+);/);
  assert(Boolean(enFontMatch), 'Found html[lang="en"] font-family rule in src/index.css');
  if (enFontMatch) {
    const fontStack = enFontMatch[1];
    const outfitIndex = fontStack.indexOf("'Outfit'");
    const iransansIndex = fontStack.indexOf("'IRANSans'");
    assert(
      outfitIndex !== -1 && (iransansIndex === -1 || outfitIndex < iransansIndex),
      'English UI font-stack prioritizes Outfit before IRANSans',
      `Stack: ${fontStack}`
    );
  }

  // ----------------------------------------------------
  // ITEM 7 & 8: AUTHENTICATION & ENGINEERING CALCULATION REGRESSION
  // ----------------------------------------------------
  console.log('\n--- 7 & 8. Testing Auth Cryptography & Engineering Calculations ---');
  const testPassword = 'TestPassword123!@#';
  const hashed = await hashPassword(testPassword);
  assert(hashed.startsWith('pbkdf2:'), 'Password hash uses PBKDF2');
  const matchValid = await verifyPassword(testPassword, hashed);
  assert(matchValid === true, 'Valid password verifies successfully');
  const matchInvalid = await verifyPassword('WrongPassword', hashed);
  assert(matchInvalid === false, 'Invalid password rejected');

  // Engineering calculation check (ISO 281 L10h calculation)
  // 6204 bearing: Cr = 13.5 kN, Cor = 6.55 kN. Under Fr = 1.35 kN, Fa = 0, P = 1.35 kN, C/P = 10, p = 3 (ball).
  // L10 = 10^3 = 1000 million revs.
  // At 1000 RPM: L10h = (1,000,000 / (60 * 1000)) * 1000 = 16,666.7 hours
  const calcResult = calculateBearingLife({
    category: 'ball',
    crKn: 13.5,
    corKn: 6.55,
    frKn: 1.35,
    faKn: 0,
    rpm: 1000,
    reliabilityLevel: 90,
  });
  assert(
    Math.abs(calcResult.L10Hours - 16666.67) < 1.0,
    `ISO 281 L10h calculation accurate: expected ~16666.7, calculated ${calcResult.L10Hours.toFixed(1)}`
  );

  const equivLoad = calculateEquivalentLoads('ball', 6.55, 2.0, 0.5);
  assert(equivLoad.P > 0, `Equivalent dynamic load calculation returns valid positive load (${equivLoad.P.toFixed(2)} kN)`);

  // SUMMARY
  console.log('\n=====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrityAudit().catch((err) => {
  console.error('Fatal error during integrity audit:', err);
  process.exit(1);
});
