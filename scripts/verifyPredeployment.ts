import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';

// Every test uses a new database. Never touch the tracked catalog or a production database.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'polad-verification-'));
process.env.DATABASE_PATH = path.join(directory, 'test.db');
process.env.NODE_ENV = 'test';
const { getDatabase, initSchema } = await import('../server/db');
const { seedDatabase } = await import('../server/scripts/seedDb');
const { contentDb } = await import('../server/services/contentDb');
const { mediaDb } = await import('../server/services/mediaDb');
const { systemDb } = await import('../server/services/systemDb');
const { validateContentPayload, validateMediaPayload } = await import('../server/validation');
const { hashPassword } = await import('../server/auth');
const { CONFIG } = await import('../server/config');
const { authRouter } = await import('../server/routes/authRoutes');
const { contentRouter } = await import('../server/routes/contentRoutes');
const { mediaRouter } = await import('../server/routes/mediaRoutes');
const db = getDatabase();
seedDatabase(false);
initSchema(db); // Migration is repeatable.

const technicalSnapshot = () => JSON.stringify(db.prepare('SELECT id,code,category,d_inner,d_outer,b_width,cr_kn,cor_kn,speed_grease_rpm,speed_oil_rpm,calculation_factor_e,calculation_factor_y,calculation_factor_y0,calculation_factor_y1,calculation_factor_y2,calculation_factor_f0,calculation_factor_x FROM products ORDER BY id').all());
const technicalBefore = technicalSnapshot();
const original = contentDb.getPageContent();
const legacy: any = structuredClone(original); delete legacy.copy; delete legacy.revision;
legacy.hero.titleSuffixFa = 'عنوان ویرایش‌شده قبلی';
legacy.hero.descriptionEn = '';
db.prepare("UPDATE cms_content SET data=? WHERE id='main'").run(JSON.stringify(legacy));
const upgraded = contentDb.getPageContent();
assert.equal(upgraded.hero.titleSuffixFa, legacy.hero.titleSuffixFa);
assert.equal(upgraded.hero.descriptionEn, '');
assert.ok(upgraded.copy.teamMembers.length);
assert.deepEqual(contentDb.getPageContent(), upgraded);
assert.equal(validateContentPayload({ copy: { tools: { formula: 'edited' } } }).isValid, false);
assert.equal(validateContentPayload({ copy: { teamMembers: [{}] } }).isValid, false);
assert.equal(validateContentPayload(JSON.parse('{"__proto__":{"admin":true}}')).isValid, false);
assert.equal(validateContentPayload({ hero: null }).isValid, false);
for (const url of ['javascript:alert(1)', 'data:text/html,a', '//evil.example/x', '/\\evil.example/x']) {
  assert.equal(validateMediaPayload({ originalName: 'bad', url, mimeType: 'image/png' }).isValid, false);
}
const changed = contentDb.updatePageContent({ revision: upgraded.revision, copy: { ...upgraded.copy, teamMembers: [], whyUs: { ...upgraded.copy.whyUs, title: { fa: 'عنوان جدید', en: '' } } } }, 'test');
assert.equal(changed.copy.whyUs.title.en, '');
assert.equal(changed.copy.teamMembers.length, 0);
assert.throws(() => contentDb.updatePageContent({ revision: upgraded.revision, hero: original.hero }, 'test'), /CONTENT_CONFLICT/);

const product = db.prepare('SELECT id FROM products LIMIT 1').get() as { id: string };
mediaDb.indexProductAssets();
const image = mediaDb.createMediaRecord({ originalName: 'Test image', mimeType: 'image/png', sizeBytes: 200, url: '/test-image.png', altTextFa: 'تصویر آزمون', altTextEn: 'Test image' }, 'test');
const image2 = mediaDb.createMediaRecord({ originalName: 'Second image', mimeType: 'image/jpeg', sizeBytes: 400, url: '/second.jpg' }, 'test');
const pdf = mediaDb.createMediaRecord({ originalName: 'Datasheet', mimeType: 'application/pdf', sizeBytes: 400, url: '/test.pdf' }, 'test');
assert.throws(() => mediaDb.createMediaRecord({ ...image }, 'test'), /already registered/);
const initial = mediaDb.getProductMedia(product.id);
let gallery = mediaDb.changeProductMedia(product.id, { action: 'attach', mediaId: image.id, version: initial.version }, 'test');
assert.ok(initial.images.every(url => gallery.images.includes(url)));
assert.throws(() => mediaDb.changeProductMedia(product.id, { action: 'primary', mediaId: image.id, version: initial.version }, 'test'), /Gallery changed/);
gallery = mediaDb.changeProductMedia(product.id, { action: 'attach', mediaId: image2.id, version: gallery.version }, 'test');
gallery = mediaDb.changeProductMedia(product.id, { action: 'primary', mediaId: image.id, version: gallery.version }, 'test');
assert.equal(gallery.imageUrl, image.url);
assert.ok(initial.images.every(url => gallery.images.includes(url)));
assert.throws(() => mediaDb.archive(image.id, true), /still in use/);
gallery = mediaDb.changeProductMedia(product.id, { action: 'move', mediaId: image2.id, toIndex: 1, version: gallery.version }, 'test');
assert.equal(gallery.images[1], image2.url);
gallery = mediaDb.changeProductMedia(product.id, { action: 'setPdf', mediaId: pdf.id, version: gallery.version }, 'test');
assert.equal(gallery.pdfUrl, pdf.url);
assert.throws(() => mediaDb.changeProductMedia(product.id, { action: 'setPdf', mediaId: image.id, version: gallery.version }, 'test'), /Select a PDF/);
assert.equal(technicalSnapshot(), technicalBefore);
gallery = mediaDb.changeProductMedia(product.id, { action: 'detach', mediaId: image.id, version: gallery.version }, 'test');
assert.equal(gallery.imageUrl, image2.url);
assert.ok(mediaDb.getMediaById(image.id));
assert.equal(mediaDb.archive(image.id, true).isArchived, true);
assert.equal(mediaDb.archive(image.id, false).isArchived, false);
const revision = mediaDb.getMediaById(image.id)!.revision;
const metadata = mediaDb.updateMetadata(image.id, { revision, altTextFa: 'جدید', altTextEn: '' });
assert.equal(metadata.altTextEn, '');
assert.throws(() => mediaDb.updateMetadata(image.id, { revision, altTextEn: 'stale' }), /Media changed/);
assert.ok(mediaDb.getMediaList('datasheet_pdf').every(asset => asset.category === 'datasheet_pdf'));

// Backups include metadata and content; older backups retain the existing library.
const backup = systemDb.exportSystemSnapshot('test');
assert.ok(backup.media.some((item: any) => item.id === image.id));
assert.equal(backup.pageContent.copy.whyUs.title.en, '');
contentDb.updatePageContent({ hero: { ...original.hero, titleSuffixEn: 'Changed after backup' } }, 'test');
systemDb.restoreSystemSnapshot(backup, 'test');
assert.equal(contentDb.getPageContent().hero.titleSuffixEn, backup.pageContent.hero.titleSuffixEn);
assert.equal(mediaDb.getMediaById(image.id)!.altTextFa, 'جدید');
assert.equal(technicalSnapshot(), technicalBefore);
const olderBackup = { ...backup }; delete olderBackup.media;
systemDb.restoreSystemSnapshot(olderBackup, 'test');
assert.ok(mediaDb.getMediaById(image.id));
assert.ok((db.prepare('SELECT snapshot_data FROM backup_snapshots ORDER BY created_at DESC LIMIT 1').get() as any).snapshot_data.includes('"media"'));

// Real HTTP and authentication boundary; no mocked database or fake API success.
const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser(CONFIG.COOKIE_SECRET));
app.use('/api/auth', authRouter); app.use('/api/content', contentRouter); app.use('/api/media', mediaRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address() as { port: number };
const base = 'http://127.0.0.1:' + address.port;
let cookie = '';
const request = (route: string, method = 'GET', body?: any, authorized = true) => fetch(base + route, { method,
  headers: { 'Content-Type': 'application/json', ...(authorized && cookie ? { Cookie: cookie } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body) });
try {
  for (const [route, method] of [['/api/media/library','GET'],['/api/media','POST'],['/api/media/upload','POST'],['/api/content','PUT'],['/api/media/products/'+product.id,'PATCH']]) {
    assert.equal((await request(route, method, method === 'GET' ? undefined : {}, false)).status, 401);
  }
  db.prepare("INSERT INTO admins (id,username,password_hash,name,email,role,created_at) VALUES (?,?,?,'Tester','','superadmin',?)")
    .run('verification-admin', 'verification', await hashPassword('Test-only-password-2026!'), new Date().toISOString());
  const login = await request('/api/auth/login','POST',{ username: 'verification', password: 'Test-only-password-2026!' });
  assert.equal(login.status,200); cookie = login.headers.get('set-cookie')!.split(';')[0];
  const publicContent = await (await request('/api/content')).json();
  const save = await request('/api/content','PUT',{ revision: publicContent.content.revision, footer: { descriptionFa: 'ذخیره از API' } });
  assert.equal(save.status,200);
  assert.equal((await request('/api/content','PUT',{ revision: publicContent.content.revision, footer: { descriptionFa: 'stale' } })).status,409);
  assert.equal((await request('/api/media','POST',{ originalName:'bad',url:'javascript:alert(1)',mimeType:'image/png' })).status,400);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
  const upload = await fetch(base + '/api/media/upload', { method:'POST',headers:{ Cookie:cookie,'Content-Type':'image/png','X-File-Name':'pixel.png' },body:png });
  assert.equal(upload.status,201);
  const asset = (await upload.json()).media;
  assert.equal(asset.sizeBytes,png.length);
  assert.ok(fs.existsSync(path.join(directory,'uploads',asset.filename)));
  const invalid = await fetch(base + '/api/media/upload', { method:'POST',headers:{ Cookie:cookie,'Content-Type':'image/png' },body:'this is not an image' });
  assert.equal(invalid.status,400);
  assert.equal((await request('/api/media/'+asset.id,'PUT',{revision:asset.revision,altTextFa:'یک پیکسل',altTextEn:'One pixel'})).status,200);
  assert.equal((await request('/api/media/'+asset.id+'/archive','PATCH',{archived:true})).status,200);
  assert.ok(fs.existsSync(path.join(directory,'uploads',asset.filename)), 'Archiving must retain original files');
  assert.equal(technicalSnapshot(),technicalBefore);
  console.log('PASS: additive CMS migration, bilingual blanks, validation, conflict detection, galleries, PDF, associations, archive/restore, upload, auth and engineering preservation');
} finally {
  server.closeAllConnections(); await new Promise<void>((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
}
