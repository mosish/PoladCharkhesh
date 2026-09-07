import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';

// Every mutating check uses a disposable copy. Never seed or patch the source catalog.
const root = process.cwd();
const sourceDb = path.join(root, 'data/poladcharkhesh.db');
const sourceHash = () => createHash('sha256').update(readFileSync(sourceDb)).digest('hex');
const originalHash = sourceHash();
const temp = mkdtempSync(path.join(tmpdir(), 'polad-phase701-'));
const testDb = path.join(temp, 'regression.db');
copyFileSync(sourceDb, testDb);
process.env.NODE_ENV = 'production';
process.env.SESSION_SECRET = 'phase701-test-session-secret-only';
process.env.COOKIE_SECRET = 'phase701-test-cookie-secret-only';
process.env.DATABASE_PATH = testDb;
process.env.TRUST_PROXY = 'loopback';
let testDatabase: { close(): void } | undefined;
let checks = 0;
function pass(label: string) { checks++; console.log(`PASS ${checks}: ${label}`); }

try {
  // Fresh processes ensure import caching cannot conceal missing production configuration.
  const configCode = `import('./server/config.ts').then(({CONFIG}) => { if (!CONFIG.SESSION_SECRET || !CONFIG.COOKIE_SECRET) process.exit(2); });`;
  for (const key of ['SESSION_SECRET', 'COOKIE_SECRET'] as const) {
    for (const value of [undefined, '', '   ']) {
      const env = { ...process.env };
      if (value === undefined) delete env[key]; else env[key] = value;
      const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', configCode], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 1, result.error?.message);
      assert.match(result.stderr, new RegExp(`${key} is required in production`));
    }
  }
  for (const env of [process.env, { ...process.env, NODE_ENV: 'development', SESSION_SECRET: '', COOKIE_SECRET: '' }]) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', configCode], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  }
  pass('production rejects each absent/empty/whitespace secret; configured production and development start');

  const { CONFIG } = await import('../config');
  const { getClientIp, createRateLimiter, logAudit } = await import('../middleware');
  const { getDatabase } = await import('../db');
  const { hashPassword } = await import('../auth');
  const { authRouter } = await import('../routes/authRoutes');
  const { productRouter } = await import('../routes/productRoutes');
  const { companyDb } = await import('../services/companyDb');
  const { publicSeoRouter } = await import('../routes/publicSeoRoutes');
  const db = getDatabase();
  testDatabase = db;
  assert.equal((db.prepare('SELECT COUNT(*) AS n FROM products').get() as any).n, 68);

  const app = express();
  app.set('trust proxy', false);
  app.use(express.json());
  app.use(cookieParser(CONFIG.COOKIE_SECRET));
  app.get('/ip', (req, res) => res.json({ ip: req.ip, helper: getClientIp(req) }));
  app.get('/limit', createRateLimiter({ max: 2, windowMs: 60000, message: 'test limit' }), (_req, res) => res.sendStatus(204));
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use(publicSeoRouter);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  // Node fetch normalizes Host; use HTTP for explicit virtual-host integration tests.
  function getWithHost(route: string, host: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      http.get(base + route, { headers: { Host: host, 'X-Forwarded-Host': 'evil.example' } }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(new Response(body, { status: res.statusCode })));
      }).on('error', reject);
    });
  }
  try {
    for (const [host, origin] of [['poladcharkhesh.ir', 'https://poladcharkhesh.ir'], ['poladcharkhesh.com', 'https://poladcharkhesh.com'], ['localhost:3000', 'https://poladcharkhesh.ir']]) {
      const sitemap = await getWithHost('/sitemap.xml', host);
      assert.equal(sitemap.status, 200);
      const xml = await sitemap.text();
      assert.equal([...xml.matchAll(/<loc>/g)].length, 69);
      assert.ok([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].every(m => m[1].startsWith(origin)), host + ': ' + xml.slice(0,350));
      assert.doesNotMatch(xml, /localhost|evil.example|#catalog/);
      const robots = await (await getWithHost('/robots.txt', host)).text();
      assert.ok(robots.includes(origin + '/sitemap.xml'));
    }
    // On a database read failure return 503, never an old static sitemap.
    db.exec('ALTER TABLE products RENAME TO products_phase701_test');
    try { assert.equal((await fetch(base + '/sitemap.xml')).status, 503); }
    finally { db.exec('ALTER TABLE products_phase701_test RENAME TO products'); }
    pass('SQLite sitemap: 68 active products + home on both domains; trusted canonical origins, robots and 503 on database failure');
    let response = await fetch(base + '/ip', { headers: { 'X-Forwarded-For': '198.51.100.9' } });
    let body = await response.json();
    assert.equal(body.ip, '127.0.0.1');
    assert.equal(body.helper, body.ip);
    for (let i = 0; i < 3; i++) {
      response = await fetch(base + '/limit', { headers: { 'X-Forwarded-For': `198.51.100.${i}` } });
      assert.equal(response.status, i < 2 ? 204 : 429);
    }
    app.set('trust proxy', CONFIG.TRUST_PROXY);
    response = await fetch(base + '/ip', { headers: { 'X-Forwarded-For': '198.51.100.9, 203.0.113.8' } });
    body = await response.json();
    assert.equal(body.ip, '203.0.113.8');
    assert.equal(body.helper, body.ip);
    // Exercise the real Express getter with a non-loopback immediate peer.
    const untrustedRequest = Object.create(app.request);
    untrustedRequest.app = app;
    untrustedRequest.socket = { remoteAddress: '192.0.2.7' };
    untrustedRequest.headers = { 'x-forwarded-for': '198.51.100.9' };
    assert.equal(getClientIp(untrustedRequest), '192.0.2.7');
    pass('direct spoofing/rate-limit bypass rejected; loopback proxy resolves nearest untrusted IP; other peers stay untrusted');

    const password = 'Phase701-Regression-Only!';
    db.prepare(`INSERT INTO admins (id,username,password_hash,name,email,role,created_at) VALUES (?,?,?,?,?,?,?)`).run('phase701-admin', 'phase701-admin', await hashPassword(password), 'Regression', 'test@example.invalid', 'superadmin', new Date().toISOString());
    response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.9, 203.0.113.8' }, body: JSON.stringify({ username: 'phase701-admin', password }) });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=Strict/i);
    assert.equal((db.prepare('SELECT ip_address FROM sessions WHERE admin_id = ?').get('phase701-admin') as any).ip_address, '203.0.113.8');
    assert.equal((db.prepare("SELECT ip_address FROM audit_logs WHERE entity_id = ? AND action = 'LOGIN'").get('phase701-admin') as any).ip_address, '203.0.113.8');
    response = await fetch(base + '/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 401);
    response = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie.split(';')[0] } });
    assert.equal(response.status, 200);
    response = await fetch(base + '/api/products', { method: 'POST', headers: { Cookie: cookie.split(';')[0], 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 401);
    pass('production HttpOnly/Secure/Strict cookies, session/audit IP agreement, unauthorized writes and revoked sessions');
  } finally { server.close(); await once(server, 'close'); }

  // Production company authority must not fall back to a seed if its record is corrupt/missing.
  const companyRecord = db.prepare("SELECT data FROM company_info WHERE id = 'main'").get() as any;
  assert.ok(companyRecord);
  db.prepare("UPDATE company_info SET data = ? WHERE id = 'main'").run('{invalid');
  assert.throws(() => companyDb.getCompanyInfo(), /Authoritative company data/);
  db.prepare("DELETE FROM company_info WHERE id = 'main'").run();
  assert.throws(() => companyDb.getCompanyInfo(), /Authoritative company data/);
  db.prepare("INSERT INTO company_info (id,data,updated_at,updated_by) VALUES ('main',?,?,?)").run(companyRecord.data, new Date().toISOString(), 'regression');
  pass('production company data refuses corrupt/missing SQLite records');

  const { dataService, DEFAULT_PAGE_CONTENT, DEFAULT_SEO_CONFIG } = await import('../../src/services/dataService');
  const { bearingProducts } = await import('../../src/data/products');
  const { COMPANY_INFO } = await import('../../src/data/company');
  const { updateDocumentSeo } = await import('../../src/utils/seo');
  const { getProductSlug } = await import('../../src/utils/productSlug');
  const { SITE_ORIGINS, resolveInitialLanguage } = await import('../../src/utils/siteDomains');
  assert.equal(bearingProducts.length, 68);
  assert.deepEqual(dataService.getActiveProducts(), []);
  assert.equal(dataService.getCatalogStatus(), 'loading');
  const originalFetch = globalThis.fetch;
  let failProducts = false, invalidProducts = false, emptyProducts = false, failCompany = false;
  const company = { ...COMPANY_INFO, nameEn: 'Authoritative Company', primaryPhone: '09000000001', landlinePhone: '02000000002', cityEn: 'Updated City', workingHoursEn: 'Mon - Fri: 09:00 - 17:00' };
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.startsWith('/api/products') && failProducts) return new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
    if (url === '/api/company' && failCompany) throw new Error('offline');
    const payload = url.startsWith('/api/products') ? (invalidProducts ? { products: null } : { products: emptyProducts ? [] : bearingProducts })
      : url === '/api/company' ? { company }
      : url === '/api/content' ? { content: DEFAULT_PAGE_CONTENT }
      : url === '/api/seo' ? { seo: DEFAULT_SEO_CONFIG } : {};
    return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    failProducts = true;
    await dataService.refreshFromServer();
    assert.equal(dataService.getCatalogStatus(), 'error'); assert.equal(dataService.getActiveProducts().length, 0);
    failProducts = false;
    await dataService.refreshFromServer();
    assert.equal(dataService.getCatalogStatus(), 'ready'); assert.equal(dataService.getActiveProducts().length, 68);
    failProducts = true;
    await dataService.refreshFromServer();
    assert.equal(dataService.getCatalogStatus(), 'error'); assert.equal(dataService.getActiveProducts().length, 0);
    failProducts = false; invalidProducts = true;
    await dataService.refreshFromServer();
    assert.equal(dataService.getCatalogStatus(), 'error'); assert.equal(dataService.getActiveProducts().length, 0);
    invalidProducts = false; emptyProducts = true;
    await dataService.refreshFromServer();
    assert.equal(dataService.getCatalogStatus(), 'ready'); assert.equal(dataService.getActiveProducts().length, 0);
    emptyProducts = false;
    await dataService.refreshFromServer();
    pass('catalog has no static bootstrap; API failure/malformed data clears stale results; retry and valid empty catalog work');

    // Minimal DOM adapter for deterministic testing of runtime metadata writes/removals.
    class Element {
      attrs: Record<string, string> = {}; id = ''; type = ''; textContent = '';
      constructor(public tag: string) {}
      setAttribute(k: string, v: string) { this.attrs[k] = v; }
      getAttribute(k: string) { return this.attrs[k]; }
      remove() { elements.splice(elements.indexOf(this), 1); }
    }
    const elements: Element[] = [];
    const documentMock = {
      title: '', head: { appendChild: (e: Element) => elements.push(e) },
      createElement: (tag: string) => new Element(tag),
      getElementById: (id: string) => elements.find(e => e.id === id),
      querySelector: (selector: string) => elements.find(e => e.tag === selector.split('[')[0] && [...selector.matchAll(/\[([^=]+)="([^"]+)"\]/g)].every(([, k, v]) => e.attrs[k] === v)),
    };
    const originalDocument = globalThis.document;
    globalThis.document = documentMock as unknown as Document;
    try {
      const meta = (selector: string, attr = 'content') => documentMock.querySelector(selector)?.getAttribute(attr);
      const schema = (id: string) => JSON.parse(documentMock.getElementById(id)!.textContent);
      assert.equal(resolveInitialLanguage('poladcharkhesh.ir', null), 'fa');
      assert.equal(resolveInitialLanguage('www.poladcharkhesh.com', null), 'en');
      assert.equal(resolveInitialLanguage('poladcharkhesh.com', 'fa'), 'fa');
      assert.equal(resolveInitialLanguage('poladcharkhesh.ir', 'en'), 'en');
      assert.equal(resolveInitialLanguage('localhost', null), 'fa');
      assert.equal(resolveInitialLanguage('unrelated.com', null), 'fa');
      for (const language of ['fa', 'en'] as const) {
        const origin = SITE_ORIGINS[language];
        for (const product of [bearingProducts[0], bearingProducts[67]]) {
          const url = origin + '/product/' + getProductSlug(product);
          updateDocumentSeo({ language, product, path: '/ignored-preview-path' });
          assert.equal(meta('link[rel="canonical"]', 'href'), url);
          assert.equal(meta('meta[property="og:url"]'), url);
          assert.equal(schema('structured-data-product').url, url);
          assert.ok(schema('structured-data-breadcrumbs').itemListElement.every((i: any) => i.item.startsWith(origin)));
          assert.equal(schema('structured-data-org').url, origin);
          assert.equal(schema('structured-data-org').telephone, company.primaryPhone);
          assert.equal(schema('structured-data-org').contactPoint[1].telephone, company.landlinePhone);
          assert.equal(schema('structured-data-org').openingHours, 'Mo-Fr 09:00-17:00');
          assert.equal(schema('structured-data-product').offers, undefined);
          assert.equal(schema('structured-data-org').image, undefined);
          assert.equal(meta('link[rel="alternate"][hreflang="en"]', 'href'), SITE_ORIGINS.en + '/product/' + getProductSlug(product));
        }
        updateDocumentSeo({ language, path: '/' });
        assert.equal(meta('link[rel="canonical"]', 'href'), origin);
        assert.equal(documentMock.getElementById('structured-data-product'), undefined);
        assert.equal(meta('meta[property="og:image"]'), undefined);
        assert.equal(meta('meta[name="twitter:image"]'), undefined);
        assert.equal(elements.filter(e => e.attrs.rel === 'canonical').length, 1);
        assert.equal(elements.filter(e => e.id === 'structured-data-org').length, 1);
      }
      failCompany = true;
      await dataService.refreshFromServer();
      updateDocumentSeo({ language: 'en', path: '/' });
      assert.equal(documentMock.getElementById('structured-data-org'), undefined);
      pass('bilingual home/products canonical/OG/schema/breadcrumb/alternate URLs, preference persistence and authoritative company changes');
      pass('navigation clears stale product images/schema; unavailable company API suppresses organization schema');
    } finally { globalThis.document = originalDocument; }
  } finally { globalThis.fetch = originalFetch; }

  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /rel="canonical"|property="og:|application\/ld\+json|unsplash\.com/);
  const css = readFileSync(path.join(root, 'src/index.css'), 'utf8');
  assert.match(css, /html\[lang="fa"\]\s*\{\s*font-family: 'IRANSans'/);
  assert.match(css, /html\[lang="en"\]\s*\{\s*font-family: 'Outfit'/);
  assert.match(css, /\.font-mono-spec\s*\{\s*font-family: 'SF Mono', 'JetBrains Mono'/);
  const appSource = readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  assert.match(appSource, /onSelectProduct=\{\(p\) => setSelectedProduct\(p\)\}/);
  assert.match(appSource, /<BearingSpecModal/); assert.match(appSource, /<ProductPage/);
  assert.match(appSource, /catalogStatus !== 'ready' \? catalogNotice : currentProduct/);
  assert.match(readFileSync(path.join(root, 'server.ts'), 'utf8'), /if \(!CONFIG.isProduction\) seedDatabase\(false\)/);
  pass('static SEO baseline, language font priority, Quick View + ProductPage wiring and production no-auto-seed policy');

  db.close();
  testDatabase = undefined;
  for (const script of ['testBackend.ts', 'verifyPhase622.ts']) {
    const legacyDb = path.join(temp, script + '.db');
    copyFileSync(sourceDb, legacyDb);
    const legacy = spawnSync(process.execPath, ['--import', 'tsx', 'server/scripts/' + script], { cwd: root, env: { ...process.env, DATABASE_PATH: legacyDb }, encoding: 'utf8', timeout: 120000 });
    console.log(legacy.stdout);
    assert.equal(legacy.status, 0, legacy.stderr || legacy.error?.message);
  }
  pass('existing Phase 6.2.1 and 6.2.2 security/auth/validation/backup/ISO 281 suites on disposable copies');
  assert.equal(sourceHash(), originalHash);
  pass('source SQLite file is byte-for-byte unchanged; both source and seed catalogs contain 68 products');
  console.log(`Phase 7.0.1: ${checks} regression groups passed.`);
} finally {
  testDatabase?.close();
  assert.equal(sourceHash(), originalHash, 'Source database must remain unchanged');
  // This is the exact directory created by mkdtemp above, never a caller-provided path.
  rmSync(temp, { recursive: true, force: true });
}
