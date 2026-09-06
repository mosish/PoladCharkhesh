import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';
import { getDatabase, runTransaction } from '../db';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  verifySession, 
  revokeSession,
  revokeAllSessions
} from '../auth';
import { CONFIG } from '../config';
import { authRouter } from '../routes/authRoutes';
import { productRouter, rowToProduct } from '../routes/productRoutes';
import { companyRouter } from '../routes/companyRoutes';
import { contentRouter } from '../routes/contentRoutes';
import { seoRouter } from '../routes/seoRoutes';
import { inquiryRouter } from '../routes/inquiryRoutes';
import { systemRouter } from '../routes/systemRoutes';
import { 
  calculateBearingLife, 
  runBearingCalculationBenchmarks,
  CANONICAL_BENCHMARK_CASES 
} from '../../src/utils/bearingCalculations';

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
  setCookieHeader?: string | string[];
}

function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: any,
  cookie?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
            setCookieHeader: res.headers['set-cookie'],
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log(' POLAD CHARKHESH — PHASE 6.2.2 FINAL VERIFICATION GATE TEST RUN ');
  console.log('================================================================\n');

  const db = getDatabase();

  // Ensure test admin exists
  const testAdminUser = 'verify_admin';
  const testAdminPass = 'InitialPass123!';
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?;').get(testAdminUser) as any;
  let adminId = existingAdmin?.id;
  if (!existingAdmin) {
    adminId = 'admin_verify_' + Date.now();
    const hash = await hashPassword(testAdminPass);
    db.prepare(`
      INSERT INTO admins (id, username, password_hash, name, email, role, created_at)
      VALUES (?, ?, ?, 'Verify Admin', 'verify@poladcharkhesh.ir', 'superadmin', ?);
    `).run(adminId, testAdminUser, hash, new Date().toISOString());
  } else {
    // Reset password to known
    const hash = await hashPassword(testAdminPass);
    db.prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?;').run(hash, adminId);
  }

  // Spin up test server
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
  const port = (server.address() as any).port;
  console.log(`[TEST SERVER] Running on port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // SECTION 5: AUTHENTICATION REAL TEST
    // -------------------------------------------------------------
    console.log('--- SECTION 5: AUTHENTICATION REAL TEST ---');
    
    // 1. Failed login
    const failLogin = await makeRequest(port, 'POST', '/api/auth/login', {
      username: testAdminUser,
      password: 'WrongPassword!',
    });
    if (failLogin.status !== 401) throw new Error(`Expected 401 for failed login, got ${failLogin.status}`);
    console.log('✓ Failed login rejected with 401');

    // 2. Successful login
    const successLogin = await makeRequest(port, 'POST', '/api/auth/login', {
      username: testAdminUser,
      password: testAdminPass,
      rememberMe: true,
    });
    if (successLogin.status !== 200) throw new Error(`Expected 200 for successful login, got ${successLogin.status}`);
    console.log('✓ Successful login returned 200 OK');

    // 3. Verify session token NOT returned in JSON
    if (successLogin.body.token || successLogin.body.sessionToken || successLogin.body.jwt) {
      throw new Error('CRITICAL SECURITY LEAK: Session token was returned in JSON response body!');
    }
    console.log('✓ Session token NOT returned in JSON response');

    // 4. Verify password hash NOT exposed in JSON
    if (successLogin.body.user?.password_hash || successLogin.body.user?.passwordHash) {
      throw new Error('CRITICAL SECURITY LEAK: Password hash exposed in user object!');
    }
    console.log('✓ Password hash NOT exposed in user profile');

    // 5. Extract session cookie
    const setCookie = successLogin.setCookieHeader;
    if (!setCookie) throw new Error('No Set-Cookie header returned on login');
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    const cookieMatch = cookieStr.match(/polad_session=([^;]+)/);
    if (!cookieMatch) throw new Error('polad_session cookie not found in Set-Cookie header');
    const cookieVal = cookieMatch[1];
    const authHeader = `polad_session=${cookieVal}`;

    // 6. Section 7: Cookie attributes check
    console.log('--- SECTION 7: COOKIE ATTRIBUTES CHECK ---');
    const lowerCookie = cookieStr.toLowerCase();
    const hasHttpOnly = lowerCookie.includes('httponly');
    const hasSameSiteStrict = lowerCookie.includes('samesite=strict');
    const hasPathSlash = lowerCookie.includes('path=/');
    console.log(`Cookie attributes detected:
    - HttpOnly: ${hasHttpOnly} (MUST BE TRUE)
    - SameSite=Strict: ${hasSameSiteStrict} (MUST BE TRUE)
    - Path=/: ${hasPathSlash} (MUST BE TRUE)
    - Secure flag: ${lowerCookie.includes('secure')} (Expected FALSE in development/HTTP, TRUE in production HTTPS)`);

    if (!hasHttpOnly) throw new Error('Cookie missing HttpOnly attribute!');
    if (!hasSameSiteStrict) throw new Error('Cookie missing SameSite=Strict attribute!');
    if (!hasPathSlash) throw new Error('Cookie missing Path=/ attribute!');
    console.log('✓ Cookie security attributes verified');

    // 7. Verify /api/auth/me with session
    console.log('--- TESTING /api/auth/me ---');
    const meRes = await makeRequest(port, 'GET', '/api/auth/me', undefined, authHeader);
    if (meRes.status !== 200) throw new Error(`Expected 200 for /me, got ${meRes.status}`);
    if (meRes.body.user?.username !== testAdminUser) throw new Error('Username mismatch on /me');
    if (meRes.body.user?.password_hash) throw new Error('Password hash leaked in /me');
    console.log(`✓ /api/auth/me returned authenticated user (${meRes.body.user.username}) without password hash`);

    // 8. Anonymous call to protected endpoint -> 401
    const anonRes = await makeRequest(port, 'GET', '/api/inquiries');
    if (anonRes.status !== 401) throw new Error(`Expected 401 for anonymous access to protected endpoint, got ${anonRes.status}`);
    console.log('✓ Anonymous protected API call correctly rejected with 401');

    // 9. Authenticated call to protected endpoint -> 200
    const authInqRes = await makeRequest(port, 'GET', '/api/inquiries', undefined, authHeader);
    if (authInqRes.status !== 200) throw new Error(`Expected 200 for authenticated access to protected endpoint, got ${authInqRes.status}`);
    console.log('✓ Authenticated protected API call succeeded with 200');

    // -------------------------------------------------------------
    // SECTION 6: PASSWORD CHANGE TEST
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: PASSWORD CHANGE TEST ---');
    // Create a second session (Simulating Session A on browser 1, Session B on browser 2)
    const sessionB = createSession(adminId, 'Browser-B', '127.0.0.1');
    const cookieHeaderB = `polad_session=${sessionB.token}`;

    // Verify Session A and Session B both work
    const checkA1 = await makeRequest(port, 'GET', '/api/auth/me', undefined, authHeader);
    const checkB1 = await makeRequest(port, 'GET', '/api/auth/me', undefined, cookieHeaderB);
    if (checkA1.status !== 200 || checkB1.status !== 200) throw new Error('Session initial validity failed');
    console.log('✓ Both Session A and Session B are initially active');

    // Change password using Session B
    const newPass = 'BrandNewPassword456!';
    const changePassRes = await makeRequest(port, 'POST', '/api/auth/change-password', {
      currentPassword: testAdminPass,
      newPassword: newPass,
    }, cookieHeaderB);
    if (changePassRes.status !== 200) throw new Error(`Expected 200 for password change, got ${changePassRes.status}`);
    console.log('✓ Password changed successfully via Session B');

    // Session A MUST be revoked
    const checkA2 = await makeRequest(port, 'GET', '/api/auth/me', undefined, authHeader);
    if (checkA2.status !== 401) throw new Error(`Session A was NOT revoked after password change! Status: ${checkA2.status}`);
    console.log('✓ Session A was successfully revoked and returned 401');

    // Session B must continue working
    const checkB2 = await makeRequest(port, 'GET', '/api/auth/me', undefined, cookieHeaderB);
    if (checkB2.status !== 200) throw new Error(`Session B stopped working after password change! Status: ${checkB2.status}`);
    console.log('✓ Active Session B continues functioning normally');

    // Old password MUST fail login
    const oldLoginFail = await makeRequest(port, 'POST', '/api/auth/login', {
      username: testAdminUser,
      password: testAdminPass,
    });
    if (oldLoginFail.status !== 401) throw new Error('Old password was still accepted after password change!');
    console.log('✓ Old password rejected with 401');

    // New password MUST succeed login
    const newLoginSuccess = await makeRequest(port, 'POST', '/api/auth/login', {
      username: testAdminUser,
      password: newPass,
    });
    if (newLoginSuccess.status !== 200) throw new Error('New password failed to log in!');
    console.log('✓ New password accepted with 200 OK');

    // Test Logout on Session B
    const logoutRes = await makeRequest(port, 'POST', '/api/auth/logout', undefined, cookieHeaderB);
    if (logoutRes.status !== 200) throw new Error(`Logout failed with status ${logoutRes.status}`);
    const checkB3 = await makeRequest(port, 'GET', '/api/auth/me', undefined, cookieHeaderB);
    if (checkB3.status !== 401) throw new Error('Session B remained valid after logout!');
    console.log('✓ Session B revoked upon logout (subsequent call returned 401)');

    // -------------------------------------------------------------
    // SECTION 8: API AUTHORIZATION & MUTATION SECURITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: API AUTHORIZATION & MUTATION ENDPOINTS ---');
    // Get fresh auth cookie from new login
    const freshCookie = Array.isArray(newLoginSuccess.setCookieHeader) 
      ? newLoginSuccess.setCookieHeader.join('; ') 
      : newLoginSuccess.setCookieHeader!;
    const freshCookieVal = freshCookie.match(/polad_session=([^;]+)/)![1];
    const adminAuth = `polad_session=${freshCookieVal}`;

    // 1. Company mutations: Whitelist enforcement
    const compMalicious = await makeRequest(port, 'PUT', '/api/company', {
      companyNameFa: 'پولاد چرخش آزمایشی',
      maliciousField: 'DROP TABLE products;',
      __proto__: { isAdmin: true },
    }, adminAuth);
    if (compMalicious.status !== 200) throw new Error(`Company update failed: ${compMalicious.status}`);
    // Check that maliciousField was not persisted
    const compCheck = await makeRequest(port, 'GET', '/api/company');
    if ((compCheck.body.company as any).maliciousField !== undefined) {
      throw new Error('Mass assignment vulnerability: maliciousField persisted!');
    }
    console.log('✓ Company update: Whitelist enforced, unapproved fields stripped');

    // 2. SEO mutations: Whitelist enforcement
    const seoUpdate = await makeRequest(port, 'PUT', '/api/seo', {
      defaultTitleFa: 'تست سئو پولاد چرخش',
      unwantedField: 12345,
    }, adminAuth);
    if (seoUpdate.status !== 200) throw new Error(`SEO update failed: ${seoUpdate.status}`);
    const seoCheck = await makeRequest(port, 'GET', '/api/seo');
    if ((seoCheck.body.seo as any).unwantedField !== undefined) {
      throw new Error('Mass assignment vulnerability: unwantedField persisted in SEO!');
    }
    console.log('✓ SEO update: Whitelist enforced, unapproved fields stripped');

    // 3. Product mutation validation (Physical dimension check: d < D)
    const invalidProd = await makeRequest(port, 'POST', '/api/products', {
      code: 'TEST-INVALID-DIM',
      category: 'ball',
      nameFa: 'بلبرینگ نامعتبر ابعادی',
      nameEn: 'Invalid Dimensions Bearing',
      d: 100,
      D: 50, // Invalid: d >= D
      B: 20,
      crKn: 10,
      corKn: 5,
    }, adminAuth);
    if (invalidProd.status !== 400) throw new Error(`Expected 400 for d >= D, got ${invalidProd.status}`);
    console.log('✓ Product creation: Dimensional sanity check rejected invalid d >= D with 400');

    // -------------------------------------------------------------
    // SECTION 9: BACKUP & RESTORE TEST
    // -------------------------------------------------------------
    console.log('\n--- SECTION 9: BACKUP & RESTORE INTEGRITY & ROLLBACK ---');
    // 1. Export valid backup
    const backupRes = await makeRequest(port, 'GET', '/api/system/backup', undefined, adminAuth);
    if (backupRes.status !== 200) throw new Error(`Backup export failed: ${backupRes.status}`);
    const backupData = backupRes.body;
    if (!backupData.products || backupData.products.length !== 68) {
      throw new Error(`Backup products count unexpected: ${backupData.products?.length}`);
    }
    console.log(`✓ Valid backup exported successfully (${backupData.products.length} products)`);

    // 2. Test restore with missing required fields -> 400
    const invalidRestore1 = await makeRequest(port, 'POST', '/api/system/restore', {
      products: [{ code: 'INCOMPLETE-PROD' }]
    }, adminAuth);
    if (invalidRestore1.status !== 400) throw new Error(`Expected 400 for incomplete restore data, got ${invalidRestore1.status}`);
    console.log('✓ Restore with incomplete product records rejected with 400');

    // 3. Test restore with empty products array -> 400
    const invalidRestore2 = await makeRequest(port, 'POST', '/api/system/restore', {
      products: []
    }, adminAuth);
    if (invalidRestore2.status !== 400) throw new Error(`Expected 400 for empty products restore, got ${invalidRestore2.status}`);
    console.log('✓ Restore with empty products array rejected with 400');

    // 4. Test pre-restore snapshot creation
    const snapshotCountBefore = (db.prepare('SELECT COUNT(*) as c FROM backup_snapshots;').get() as any).c;
    // Perform a valid restore using the exported backup
    const validRestore = await makeRequest(port, 'POST', '/api/system/restore', backupData, adminAuth);
    if (validRestore.status !== 200) throw new Error(`Valid restore failed: ${validRestore.status}`);
    const snapshotCountAfter = (db.prepare('SELECT COUNT(*) as c FROM backup_snapshots;').get() as any).c;
    if (Number(snapshotCountAfter) <= Number(snapshotCountBefore)) {
      throw new Error('Pre-restore auto-snapshot was not created in backup_snapshots table!');
    }
    console.log('✓ Automatic pre-restore snapshot verified in backup_snapshots table');

    // Verify catalog count after restore is exactly 68
    const postRestoreCount = (db.prepare('SELECT COUNT(*) as c FROM products;').get() as any).c;
    if (Number(postRestoreCount) !== 68) throw new Error(`Catalog count after restore is ${postRestoreCount}, expected 68`);
    console.log('✓ Catalog products verified at exactly 68 items after restore');

    // -------------------------------------------------------------
    // SECTION 11: ENGINEERING REGRESSION (ISO 281 CALCULATIONS)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 11: ENGINEERING REGRESSION (ISO 281 CALCULATIONS) ---');
    
    // Standard ISO 281 Benchmark Test Cases (5 canonical industrial test cases)
    const benchmarkResults = runBearingCalculationBenchmarks();
    for (const res of benchmarkResults.results) {
      if (!res.passed) {
        throw new Error(`ISO 281 benchmark case ${res.name} failed! Error: ${res.relativeErrorL10hPercent}%`);
      }
      console.log(`✓ ${res.name}: P=${res.actualP}kN, L10h=${res.actualL10h} hrs (Expected: ${res.expectedL10h} hrs, err: ${res.relativeErrorL10hPercent}%)`);
    }

    if (!benchmarkResults.allPassed) {
      throw new Error(`ISO 281 benchmark suites failed: ${benchmarkResults.passedTests}/${benchmarkResults.totalTests} passed`);
    }
    console.log(`✓ ISO 281 Benchmark Suite: All ${benchmarkResults.totalTests} canonical test cases passed (<0.5% tolerance)`);

    console.log('\n================================================================');
    console.log('   ALL VERIFICATION GATE TESTS EXECUTED AND PASSED WITH 100%   ');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('FATAL VERIFICATION ERROR:', err);
  process.exit(1);
});
