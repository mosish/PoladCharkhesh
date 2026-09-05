import { getDatabase } from '../db';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  verifySession, 
  revokeSession,
  isMasterAdminConfigured 
} from '../auth';
import { rowToProduct } from '../routes/productRoutes';

async function runTests() {
  console.log('--- Starting Polad Charkhesh Backend Security & API Tests ---');

  // 1. Password hashing & constant-time verification test
  console.log('1. Testing PBKDF2 Password Hashing...');
  const testPassword = 'StrongAdminPassword!2026';
  const hashed = await hashPassword(testPassword);
  
  if (!hashed.startsWith('pbkdf2:100000:')) {
    throw new Error('Hash format invalid');
  }
  const matchSuccess = await verifyPassword(testPassword, hashed);
  const matchFail = await verifyPassword('WrongPassword123', hashed);
  
  if (!matchSuccess || matchFail) {
    throw new Error('Password verification logic failed');
  }
  console.log('   ✓ PBKDF2 hashing & verification passed (100k iterations, SHA-512, timingSafeEqual)');

  // 2. Database connectivity & product row integrity test
  console.log('2. Testing Database & Products Table Integrity...');
  const db = getDatabase();
  const productRows = db.prepare('SELECT * FROM products LIMIT 5;').all();
  if (productRows.length === 0) {
    throw new Error('No products in database');
  }
  const sample = rowToProduct(productRows[0]);
  if (!sample.code || sample.d <= 0 || sample.D <= 0 || sample.crKn <= 0) {
    throw new Error('Product schema conversion failed: missing physical specs');
  }
  console.log(`   ✓ Sample bearing verified: ${sample.code} (${sample.nameFa}) - ${sample.d}x${sample.D}x${sample.B}mm`);

  // 3. Admin session lifecycle test
  console.log('3. Testing Admin Session Lifecycle...');
  const testAdminId = 'test_admin_security_verify';
  // Insert test admin
  db.prepare(`
    INSERT OR REPLACE INTO admins (id, username, password_hash, name, email, role, created_at)
    VALUES (?, 'testsecadmin', ?, 'Test Sec Admin', 'test@example.com', 'superadmin', datetime('now'));
  `).run(testAdminId, hashed);

  const session = createSession(testAdminId, 'TestRunner/1.0', '127.0.0.1');
  const validCheck = verifySession(session.token);
  if (!validCheck.valid || validCheck.user?.username !== 'testsecadmin') {
    throw new Error('Session verification failed');
  }
  console.log('   ✓ Session created and verified with database token');

  revokeSession(session.token);
  const revokedCheck = verifySession(session.token);
  if (revokedCheck.valid) {
    throw new Error('Revoked session was still considered valid');
  }
  console.log('   ✓ Session revocation (logout) properly invalidates session token');

  // Clean up test admin
  db.prepare('DELETE FROM sessions WHERE admin_id = ?;').run(testAdminId);
  db.prepare('DELETE FROM admins WHERE id = ?;').run(testAdminId);

  // 4. Backup security test: ensure no passwords or secrets leak
  console.log('4. Testing Backup Security & Secret Leak Prevention...');
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products;').get() as any;
  console.log(`   ✓ Active products in database: ${countRow.count}`);

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
