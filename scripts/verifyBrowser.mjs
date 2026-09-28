import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'polad-browser-'));
process.env.DATABASE_PATH = path.join(directory, 'browser.db');
process.env.NODE_ENV = 'test';
const { getDatabase } = await import('../server/db.ts');
const { seedDatabase } = await import('../server/scripts/seedDb.ts');
const { hashPassword } = await import('../server/auth.ts');
seedDatabase(false);
const db = getDatabase();
db.prepare("INSERT INTO admins (id,username,password_hash,name,email,role,created_at) VALUES ('browser-admin','browser',?,'Browser Test','','superadmin',?)")
  .run(await hashPassword('Browser-test-only-2026!'), new Date().toISOString());
const product = db.prepare('SELECT id,code,slug FROM products ORDER BY code LIMIT 1').get();
fs.mkdirSync('test-results', { recursive: true });
const serverLog = fs.openSync('test-results/server.log', 'w');
const server = spawn(process.execPath, ['dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production',
  SESSION_SECRET: 'browser-verification-only-session-secret-2026', COOKIE_SECRET: 'browser-verification-only-cookie-secret-2026' },
  stdio: ['ignore', serverLog, serverLog] });
const base = 'http://localhost:3000';
let browser;
const errors = [];
try {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Production server exited: ' + fs.readFileSync('test-results/server.log','utf8'));
    try { if ((await fetch(base + '/api/health')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => { if (!localStorage.getItem('polad_preferred_language')) localStorage.setItem('polad_preferred_language', 'en'); });
  const page = await context.newPage();
  const preview = async name => { await page.evaluate(() => window.scrollTo(0,0)); console.log('VISUAL_PREVIEW:' + name + ':' + (await page.screenshot({type:'jpeg',quality:35})).toString('base64')); };
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.locator('#why-us h2').waitFor();
  const assetPaths = fs.readdirSync('public/assets/images').filter(name => /\.(webp|png|jpe?g)$/i.test(name)).map(name => '/assets/images/' + name);
  const assetHealth = await page.evaluate(async urls => Promise.all(urls.map(url => new Promise(resolve => {
    const img = new Image(); const timer = setTimeout(() => resolve({ url, ok:false, reason:'timeout' }),10000);
    img.onload = () => { clearTimeout(timer); resolve({ url, ok:img.naturalWidth > 0 }); };
    img.onerror = () => { clearTimeout(timer); resolve({ url, ok:false, reason:'decode/load failure' }); }; img.src = url;
  }))),assetPaths);
  fs.writeFileSync('test-results/asset-health.json',JSON.stringify(assetHealth,null,2));
  console.log('BASELINE_ASSET_AUDIT:' + JSON.stringify(assetHealth));
  if (assetHealth.some(asset => !asset.ok)) console.warn('Existing repository images failed decoding. Replace from original approved photos before launch; see asset-health.json.');
  await page.screenshot({ path: 'test-results/home-en-desktop.png', fullPage: true });
  await preview('public-desktop');
  assert.ok(await page.locator('#catalog').isVisible());
  await page.getByRole('button', { name: 'Quick view', exact: true }).first().click();
  await page.waitForFunction(() => document.body.style.overflow === 'hidden');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.style.overflow !== 'hidden');
  await page.getByRole('link', { name: 'Product page', exact: true }).first().click();
  assert.match(page.url(), /\/product\//);
  await page.screenshot({ path: 'test-results/product-en-desktop.png', fullPage: true });

  const login = await context.request.post(base + '/api/auth/login', { data: { username:'browser', password:'Browser-test-only-2026!' } });
  assert.equal(login.status(),200);
  // The test uses local HTTP, while production correctly marks session cookies Secure.
  const cookie = login.headers()['set-cookie'].split(';')[0];
  await context.addCookies([{ name:'polad_session', value:cookie.slice(cookie.indexOf('=') + 1), url:base, httpOnly:true, sameSite:'Strict' }]);
  await page.goto(base + '/#admin/content');
  await page.getByRole('heading', { name:'Website content',exact:true }).waitFor();
  await page.locator('.editor-sections').waitFor();
  await page.getByRole('button', { name:/Why choose us/ }).click();
  await page.getByLabel('English', { exact:true }).nth(1).fill('CMS verification title');
  await page.getByRole('button', { name:'Save content',exact:true }).click();
  await page.getByText('Saved and published to the website.', { exact:true }).waitFor();
  await page.screenshot({ path:'test-results/admin-content-en.png',fullPage:true });
  await preview('cms-desktop');
  await page.goto(base);
  await page.getByRole('heading', { name:'CMS verification title',exact:true }).waitFor();

  await page.goto(base + '/#admin/media');
  await page.getByRole('heading', { name:'Media library',exact:true }).waitFor();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type=file]').setInputFiles({ name:'browser-image.png',mimeType:'image/png',buffer:png });
  await page.getByLabel('English alt text', { exact:true }).waitFor();
  await page.getByLabel('English alt text', { exact:true }).fill('Verified gallery image');
  await page.getByLabel('متن جایگزین فارسی', { exact:true }).fill('تصویر تأییدشده');
  await page.getByRole('button', { name:'Save metadata',exact:true }).click();
  await page.getByRole('button', { name:'Save metadata',exact:true }).waitFor({ state:'visible' });
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent === 'Attach selected asset to product')?.disabled || !document.querySelector('fieldset[disabled]'));
  await page.getByLabel('Select product', { exact:true }).selectOption(product.id);
  await page.getByRole('button', { name:'Attach selected asset to product',exact:true }).click();
  const gallery = page.locator('section').filter({ has:page.getByRole('heading',{name:'Product gallery & PDF',exact:true}) });
  await gallery.getByRole('img', { name:'Verified gallery image',exact:true }).waitFor();
  await gallery.locator('.media-tile').filter({ has:page.getByRole('img',{name:'Verified gallery image',exact:true}) }).getByRole('button',{name:'Primary',exact:true}).click();
  await page.screenshot({ path:'test-results/admin-media-en.png',fullPage:true });
  await preview('media-desktop');
  await page.goto(base + '/product/' + product.slug);
  await page.getByRole('button', { name:/Real Part Photo 1/ }).first().click();
  await page.getByRole('img',{name:'Verified gallery image',exact:true}).waitFor();

  for (const language of ['en','fa']) {
    await page.evaluate(lang => localStorage.setItem('polad_preferred_language',lang),language);
    await page.setViewportSize({ width:390,height:844 });
    await page.goto(base);
    await page.waitForFunction(lang => document.documentElement.lang === lang,language);
    await page.locator('#why-us h2').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Public horizontal overflow in ' + language);
    await page.screenshot({path:'test-results/home-' + language + '-mobile.png',fullPage:true});
    if (language === 'fa') await preview('public-fa-mobile');
    await page.goto(base + '/#admin/content');
    await page.locator('.admin-editor textarea').first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Admin horizontal overflow in ' + language);
    await page.screenshot({path:'test-results/admin-content-' + language + '-mobile.png',fullPage:true});
    if (language === 'fa') await preview('cms-fa-mobile');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: production runtime, Quick View + ProductPage, CMS save/persistence, media upload/alt/association/primary, FA/EN mobile overflow checks, no browser exceptions');
 } catch (error) {
  console.error('Browser errors:', errors);
  const failedPage = browser?.contexts()[0]?.pages()[0];
  if (failedPage) {
    console.error('Page URL:', failedPage.url());
    console.error('Page text:', (await failedPage.locator('body').innerText()).slice(0,12000));
    await failedPage.screenshot({path:'test-results/failure.png',fullPage:true}).catch(() => {});
  }
  fs.writeFileSync('test-results/failure.txt',String(error.stack ?? error) + '\nBrowser errors: ' + JSON.stringify(errors));
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill(); fs.closeSync(serverLog);
}
