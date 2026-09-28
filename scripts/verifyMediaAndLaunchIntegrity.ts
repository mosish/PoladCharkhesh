import './testDatabase';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { CONFIG } from '../server/config';
import { getDatabase, runTransaction } from '../server/db';
import { authRouter } from '../server/routes/authRoutes';
import { productRouter } from '../server/routes/productRoutes';
import { mediaRouter } from '../server/routes/mediaRoutes';
import { systemRouter } from '../server/routes/systemRoutes';
import { hashPassword } from '../server/auth';
import { mediaDb } from '../server/services/mediaDb';
import { productDb } from '../server/services/productDb';
import { systemDb } from '../server/services/systemDb';

async function main() {
  console.log('=====================================================');
  console.log('FINAL LAUNCH INTEGRITY: MEDIA UPLOAD, REFS & RESET');
  console.log('=====================================================');

  const db = getDatabase();

  // 1. Verify Canonical 68 Products Invariant
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products;').get() as { count: number | bigint };
  const count = Number(countRow.count);
  assert.equal(count, 68, 'Database must have exactly 68 products');
  console.log('✓ PASS: Products count is strictly 68');

  // Verify engineering invariants for a sample bearing
  const sample = db.prepare("SELECT code, d_inner, d_outer, b_width, cr_kn, cor_kn FROM products WHERE code = ?;").get('6204-2RSH / 2RS1') as any;
  assert.equal(sample.d_inner, 20);
  assert.equal(sample.cr_kn, 13.5);
  console.log('✓ PASS: Engineering parameters for 6204-2RSH / 2RS1 intact');

  // Setup express test server on ephemeral port
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser(CONFIG.COOKIE_SECRET));

  const uploadDir = path.join(path.dirname(CONFIG.DATABASE_PATH), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/system', systemRouter);

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let superadminCookie = '';
  let editorCookie = '';

  try {
    // 2. Authentication & Role Boundaries
    const superPass = 'TestSuperAdmin2026!#';
    const editorPass = 'TestEditor2026!#';
    const superHash = await hashPassword(superPass);
    const editorHash = await hashPassword(editorPass);
    const nowIso = new Date().toISOString();

    db.prepare("DELETE FROM admins WHERE username IN ('test_super', 'test_editor');").run();
    db.prepare('INSERT INTO admins (id, username, password_hash, name, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);')
      .run('adm_test_super', 'test_super', superHash, 'Test Super', 'super@example.com', 'superadmin', nowIso);
    db.prepare('INSERT INTO admins (id, username, password_hash, name, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);')
      .run('adm_test_editor', 'test_editor', editorHash, 'Test Editor', 'editor@example.com', 'editor', nowIso);

    // Login superadmin
    const superLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_super', password: superPass }),
    });
    assert.equal(superLogin.status, 200);
    superadminCookie = superLogin.headers.get('set-cookie')!.split(';')[0];

    // Login editor
    const editorLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_editor', password: editorPass }),
    });
    assert.equal(editorLogin.status, 200);
    editorCookie = editorLogin.headers.get('set-cookie')!.split(';')[0];

    console.log('✓ PASS: Superadmin and Editor authentication verified');

    // 3. Physical Upload & Magic-byte Security
    // Attempt invalid file (spoofed extension with bad content)
    const spoofedUpload = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'X-File-Name': 'malicious.php',
        Cookie: superadminCookie,
      },
      body: Buffer.from('<?php echo "evil"; ?>'),
    });
    assert.equal(spoofedUpload.status, 400, 'Spoofed file without valid magic bytes must be rejected');
    console.log('✓ PASS: Spoofed upload rejected via magic-byte signature check');

    // Valid PNG upload
    const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
    const pngUpload = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'X-File-Name': encodeURIComponent('test-bearing-photo.png'),
        Cookie: superadminCookie,
      },
      body: validPng,
    });
    assert.equal(pngUpload.status, 201);
    const pngResult = await pngUpload.json();
    assert.ok(pngResult.media?.id);
    assert.ok(pngResult.media.url.startsWith('/uploads/'));
    const savedPath = path.join(uploadDir, pngResult.media.filename);
    assert.ok(fs.existsSync(savedPath), 'Uploaded file must physically exist in uploads directory');
    console.log('✓ PASS: Valid PNG physically uploaded and registered in SQLite');

    // Valid PDF upload
    const validPdf = Buffer.from('%PDF-1.4\n%test\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
    const pdfUpload = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-File-Name': encodeURIComponent('test-bearing-datasheet.pdf'),
        Cookie: superadminCookie,
      },
      body: validPdf,
    });
    assert.equal(pdfUpload.status, 201);
    const pdfResult = await pdfUpload.json();
    assert.equal(pdfResult.media.category, 'datasheet_pdf');
    console.log('✓ PASS: Valid PDF datasheet uploaded and categorized');

    // 4. Product Gallery Attachment & Immutability of Engineering Parameters
    const prod = db.prepare("SELECT id, code, d_inner, cr_kn FROM products WHERE code = ?;").get('6204-2RSH / 2RS1') as any;
    const initialD = prod.d_inner;
    const initialCr = prod.cr_kn;

    // Attach uploaded image to product
    const attachRes = await fetch(`${baseUrl}/api/media/products/${prod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
      body: JSON.stringify({ action: 'attach', mediaUrl: pngResult.media.url }),
    });
    assert.equal(attachRes.status, 200);

    // Set as primary image
    const primaryRes = await fetch(`${baseUrl}/api/media/products/${prod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
      body: JSON.stringify({ action: 'primary', mediaUrl: pngResult.media.url }),
    });
    assert.equal(primaryRes.status, 200);

    // Verify engineering parameters did NOT change
    const afterGallery = db.prepare('SELECT d_inner, cr_kn, image_url, images FROM products WHERE id = ?;').get(prod.id) as any;
    assert.equal(afterGallery.d_inner, initialD, 'Dimensions must be strictly immutable during gallery edits');
    assert.equal(afterGallery.cr_kn, initialCr, 'Load ratings must be strictly immutable during gallery edits');
    assert.equal(afterGallery.image_url, pngResult.media.url);
    console.log('✓ PASS: Product gallery updated while engineering parameters remained strictly invariant');

    // 5. Reference Checking & Safe Deletion
    // Try to delete media while attached to 6204-2RSH / 2RS1 -> must fail with 409
    const blockedDelete = await fetch(`${baseUrl}/api/media/${pngResult.media.id}`, {
      method: 'DELETE',
      headers: { Cookie: superadminCookie },
    });
    assert.equal(blockedDelete.status, 409, 'In-use media deletion must be blocked with HTTP 409');
    const blockedData = await blockedDelete.json();
    assert.ok(blockedData.inUse?.includes('6204-2RSH / 2RS1'), 'Error must report dependent product code');
    console.log('✓ PASS: Reference checking blocked deletion of in-use asset (reported 6204-2RSH / 2RS1)');

    // Detach from product
    const detachRes = await fetch(`${baseUrl}/api/media/products/${prod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
      body: JSON.stringify({ action: 'detach', mediaUrl: pngResult.media.url }),
    });
    assert.equal(detachRes.status, 200);

    // Unreferenced metadata removal retains bytes for restorable backups
    const allowedDelete = await fetch(`${baseUrl}/api/media/${pngResult.media.id}`, {
      method: 'DELETE',
      headers: { Cookie: superadminCookie },
    });
    assert.equal(allowedDelete.status, 200);
    assert.ok(fs.existsSync(savedPath), 'Backup recovery must retain uploaded bytes');
    assert.equal(mediaDb.getMediaById(pngResult.media.id), null);
    console.log('✓ PASS: Unreferenced metadata removed; physical file retained for backup recovery');

    // Clean up test PDF
    const pdfPath = path.join(uploadDir, pdfResult.media.filename);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    db.prepare('DELETE FROM media_metadata WHERE id = ?;').run(pdfResult.media.id);

    // 6. Factory Reset Role Authorization & Execution
    // Editor role should be rejected with 403
    const forbiddenReset = await fetch(`${baseUrl}/api/system/factory-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: editorCookie },
      body: JSON.stringify({ username: 'test_editor' }),
    });
    assert.equal(forbiddenReset.status, 403, 'Editor role must be rejected from factory reset');
    console.log('✓ PASS: Non-superadmin role forbidden from factory reset (HTTP 403)');

    // Superadmin reset executes successfully and maintains 68 products
    const allowedReset = await fetch(`${baseUrl}/api/system/factory-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
      body: JSON.stringify({ username: 'test_super' }),
    });
    assert.equal(allowedReset.status, 200);
    const resetData = await allowedReset.json();
    assert.equal(resetData.productsCount, 68);
    const postResetCount = (db.prepare('SELECT COUNT(*) as c FROM products;').get() as any).c;
    assert.equal(postResetCount, 68);
    console.log('✓ PASS: Superadmin factory reset restored exactly 68 canonical products');

    // Clean up test admins
    db.prepare("DELETE FROM admins WHERE username IN ('test_super', 'test_editor');").run();

    console.log('\n=====================================================');
    console.log('ALL FINAL LAUNCH INTEGRITY CHECKS PASSED WITH 100% SUCCESS!');
    console.log('=====================================================');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
