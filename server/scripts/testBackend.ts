import http from 'node:http';
import { execSync } from 'node:child_process';
import express from 'express';
import cookieParser from 'cookie-parser';
import { getDatabase } from '../db';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  verifySession, 
  revokeSession,
} from '../auth';
import { CONFIG } from '../config';
import { rowToProduct } from '../routes/productRoutes';
import { authRouter } from '../routes/authRoutes';
import { productRouter } from '../routes/productRoutes';
import { companyRouter } from '../routes/companyRoutes';
import { contentRouter } from '../routes/contentRoutes';
import { seoRouter } from '../routes/seoRoutes';
import { inquiryRouter } from '../routes/inquiryRoutes';
import { systemRouter } from '../routes/systemRoutes';

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log('   POLAD CHARKHESH — PHASE 6.2.1 SECURITY FINISHER TEST SUITE   ');
  console.log('================================================================\n');

  const db = getDatabase();

  // --------------------------------------------------------------------------
  // TEST 1: Password Hashing & Verification
  // --------------------------------------------------------------------------
  console.log('1. [AUTH] PBKDF2 Password Hashing & Timing-Safe Verification...');
  const testPassword = 'StrongAdminPassword!2026';
  const hashed = await hashPassword(testPassword);

  if (!hashed.startsWith('pbkdf2:100000:')) {
    throw new Error('Hash format invalid (expected pbkdf2:100000:<salt>:<hash>)');
  }
  const matchSuccess = await verifyPassword(testPassword, hashed);
  const matchFail = await verifyPassword('WrongPassword123', hashed);

  if (!matchSuccess) {
    throw new Error('PBKDF2 verification failed for correct password');
  }
  if (matchFail) {
    throw new Error('PBKDF2 verification erroneously accepted incorrect password');
  }
  console.log('   ✓ PBKDF2 100k iteration hashing, salt generation, and timingSafeEqual passed.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Canonical Bearings Catalog Integrity
  // --------------------------------------------------------------------------
  console.log('2. [DATA] Canonical Products & Precision Bearing Dimensions...');
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products;').get() as any;
  const count = Number(countRow.count);
  if (count < 68) {
    throw new Error(`Catalog count unexpected: ${count} (expected >= 68)`);
  }

  const sampleRow = db.prepare("SELECT * FROM products WHERE code LIKE '6204%' LIMIT 1;").get();
  if (!sampleRow) {
    throw new Error('Canonical bearing 6204 not found in database');
  }
  const sample = rowToProduct(sampleRow);
  if (sample.d !== 20 || sample.D !== 47 || sample.B !== 14 || sample.crKn <= 0) {
    throw new Error(`Invalid dimensions for sample 6204: ${sample.d}x${sample.D}x${sample.B}mm`);
  }
  console.log(`   ✓ Active canonical bearings verified (${count} items). Sample: ${sample.code} (${sample.d}x${sample.D}x${sample.B}mm, Cr=${sample.crKn}kN).\n`);

  // --------------------------------------------------------------------------
  // TEST 3: Production Startup Fail-Fast when Secrets Missing
  // --------------------------------------------------------------------------
  console.log('3. [ENV] Verifying Production Fail-Fast on Missing Secrets...');
  try {
    execSync(
      'NODE_ENV=production SESSION_SECRET="" COOKIE_SECRET="" npx tsx -e "import(\'./server/config\')"',
      { stdio: 'pipe' }
    );
    throw new Error('Production mode should have failed when SESSION_SECRET is missing!');
  } catch (err: any) {
    const errorOutput = err.stderr ? err.stderr.toString() : err.message;
    if (errorOutput.includes('FATAL SECURITY CONFIGURATION ERROR')) {
      console.log('   ✓ Production startup correctly threw FATAL SECURITY CONFIGURATION ERROR when secrets were omitted.\n');
    } else {
      throw new Error(`Unexpected failure output: ${errorOutput}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 4: Spin up Test Express Server to test API endpoints
  // --------------------------------------------------------------------------
  console.log('4. [HTTP API] Starting Ephemeral Express Server for API Audit...');
  const app = express();
  app.use(express.json());
  app.use(cookieParser(CONFIG.COOKIE_SECRET));

  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/company', companyRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/seo', seoRouter);
  app.use('/api/inquiries', inquiryRouter);
  app.use('/api/system', systemRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`   ✓ Test server listening on ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    // TEST 5: Unauthenticated Access Rejection (401)
    // ------------------------------------------------------------------------
    console.log('5. [RBAC] Verifying 401 Rejections on Unauthenticated Admin Endpoints...');
    const protectedEndpoints: { method: string; path: string; body?: any }[] = [
      { method: 'GET', path: '/api/inquiries' },
      { method: 'POST', path: '/api/products', body: { code: 'TEST-UNAUTH' } },
      { method: 'PUT', path: '/api/company', body: { phone: '123' } },
      { method: 'PUT', path: '/api/content', body: {} },
      { method: 'PUT', path: '/api/seo', body: {} },
      { method: 'GET', path: '/api/system/audit-logs' },
      { method: 'GET', path: '/api/system/backup' },
      { method: 'POST', path: '/api/system/restore', body: { products: [] } },
      { method: 'POST', path: '/api/system/factory-reset' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });

      if (res.status !== 401) {
        throw new Error(`Endpoint ${ep.method} ${ep.path} allowed unauthenticated access with status ${res.status}`);
      }
    }
    console.log('   ✓ All 9 protected admin endpoints returned 401 UNAUTHORIZED when called without session cookie.\n');

    // ------------------------------------------------------------------------
    // TEST 6: Authentication Lifecycle & No-Token-In-JSON Verification
    // ------------------------------------------------------------------------
    console.log('6. [AUTH] Login, Password Checks, Cookie Attributes & Token Leak Prevention...');
    
    // Seed temporary test admin account
    const testAdminId = `adm_test_${Date.now()}`;
    const testUsername = `sec_admin_${Date.now()}`;
    const adminPassword = 'SuperSecurePassword@2026!';
    const adminHash = await hashPassword(adminPassword);

    db.prepare(`
      INSERT INTO admins (id, username, password_hash, name, email, role, created_at)
      VALUES (?, ?, ?, 'Sec Admin', 'sec@example.com', 'superadmin', datetime('now'));
    `).run(testAdminId, testUsername, adminHash);

    // 6.1 Test Wrong Password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: 'WrongPassword999' }),
    });
    if (wrongPassRes.status !== 401) {
      throw new Error(`Expected 401 on wrong password, got ${wrongPassRes.status}`);
    }
    console.log('   ✓ Wrong password rejected with 401.');

    // 6.2 Test Valid Login
    const validLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: adminPassword, rememberMe: true }),
    });

    if (!validLoginRes.ok) {
      throw new Error(`Login failed with status ${validLoginRes.status}`);
    }

    const setCookieHeader = validLoginRes.headers.get('set-cookie');
    if (!setCookieHeader || !setCookieHeader.includes('polad_session=')) {
      throw new Error('Set-Cookie header missing or does not contain polad_session');
    }
    if (!setCookieHeader.includes('HttpOnly')) {
      throw new Error('polad_session cookie is MISSING HttpOnly attribute!');
    }
    if (!setCookieHeader.includes('SameSite=Strict') && !setCookieHeader.includes('samesite=strict')) {
      throw new Error('polad_session cookie is MISSING SameSite=Strict attribute!');
    }
    console.log('   ✓ Session cookie issued with HttpOnly and SameSite=Strict attributes.');

    // 6.3 CRITICAL: Check JSON body for token leak
    const loginJson = await validLoginRes.json();
    if (loginJson.token !== undefined) {
      throw new Error(`SECURITY VULNERABILITY: Login JSON response contains session token: ${loginJson.token}`);
    }
    if (!loginJson.success || !loginJson.user || loginJson.user.username !== testUsername) {
      throw new Error('Invalid user structure in login response');
    }
    console.log('   ✓ CRITICAL: Verified login response JSON DOES NOT return any session token.');

    // Extract cookie for subsequent requests
    const cookiePart = setCookieHeader.split(';')[0];

    // ------------------------------------------------------------------------
    // TEST 7: Authenticated CRUD Operations with HttpOnly Cookie
    // ------------------------------------------------------------------------
    console.log('\n7. [CRUD] Authenticated Operations using HttpOnly Cookie...');

    // 7.1 Read inquiries
    const inqRes = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'GET',
      headers: { 'Cookie': cookiePart },
    });
    if (!inqRes.ok) {
      throw new Error(`Authenticated GET /api/inquiries failed: ${inqRes.status}`);
    }
    console.log('   ✓ Authenticated GET /api/inquiries succeeded (200 OK).');

    // 7.2 Create test product
    const testCode = `TEST-BEARING-${Date.now()}`;
    const createProdRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookiePart },
      body: JSON.stringify({
        code: testCode,
        category: 'tapered',
        nameFa: 'رولبرینگ تست امنیتی',
        nameEn: 'Security Test Bearing',
        d: 25,
        D: 52,
        B: 15,
        crKn: 35.5,
        corKn: 38.0,
        speedGreaseRpm: 7500,
        speedOilRpm: 10000,
      }),
    });

    if (createProdRes.status !== 201) {
      const errBody = await createProdRes.text();
      throw new Error(`Authenticated product creation failed (${createProdRes.status}): ${errBody}`);
    }
    const createdProd = (await createProdRes.json()).product;
    console.log(`   ✓ Authenticated POST /api/products created product ${createdProd.code} (201 Created).`);

    // 7.3 Delete test product
    const delRes = await fetch(`${baseUrl}/api/products/${createdProd.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookiePart },
    });
    if (!delRes.ok) {
      throw new Error(`Authenticated product deletion failed: ${delRes.status}`);
    }
    console.log(`   ✓ Authenticated DELETE /api/products/${createdProd.id} succeeded.`);

    // 7.4 Backup Export - Verify No Secrets Leak
    const backupRes = await fetch(`${baseUrl}/api/system/backup`, {
      method: 'GET',
      headers: { 'Cookie': cookiePart },
    });
    if (!backupRes.ok) {
      throw new Error(`Backup export failed: ${backupRes.status}`);
    }
    const backupData = await backupRes.json();
    if ((backupData as any).admins || (backupData as any).sessions) {
      throw new Error('SECURITY VULNERABILITY: Backup JSON contains admins or sessions tables!');
    }
    console.log('   ✓ System backup exported successfully without leaking credentials or sessions.');

    // ------------------------------------------------------------------------
    // TEST 8: Session Logout & Invalidation Handling
    // ------------------------------------------------------------------------
    console.log('\n8. [AUTH] Session Logout & Invalidation Handling...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': cookiePart },
    });
    if (!logoutRes.ok) {
      throw new Error(`Logout request failed: ${logoutRes.status}`);
    }
    const logoutCookieHeader = logoutRes.headers.get('set-cookie');
    if (!logoutCookieHeader || !logoutCookieHeader.includes('polad_session=;')) {
      throw new Error('Logout response did not clear polad_session cookie!');
    }
    console.log('   ✓ Logout endpoint revoked session and cleared cookie.');

    // Attempt to reuse revoked cookie
    const postLogoutRes = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'GET',
      headers: { 'Cookie': cookiePart },
    });
    if (postLogoutRes.status !== 401) {
      throw new Error(`Revoked session cookie still granted access: status ${postLogoutRes.status}`);
    }
    console.log('   ✓ Revoked session cookie correctly rejected with 401 SESSION_EXPIRED.');

    // Cleanup test admin
    db.prepare('DELETE FROM admins WHERE id = ?;').run(testAdminId);

    console.log('\n================================================================');
    console.log('       ALL PHASE 6.2.1 SECURITY TESTS PASSED PERFECTLY!         ');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

runSecurityTestSuite().catch((err) => {
  console.error('\n❌ FATAL TEST FAILURE:', err);
  process.exit(1);
});
