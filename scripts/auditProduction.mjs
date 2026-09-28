import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'polad-production-audit-'));
const database = path.join(dir, 'test.db');
fs.copyFileSync('data/poladcharkhesh.db', database);
const db = new DatabaseSync(database);
db.exec('DELETE FROM sessions; DELETE FROM admins;');
db.close();
const listener = net.createServer(); await new Promise(r => listener.listen(0, '127.0.0.1', r));
const port = listener.address().port; await new Promise(r => listener.close(r));
const base = `http://127.0.0.1:${port}`;
const env = { ...process.env, NODE_ENV:'production', DATABASE_PATH:database, HOST:'127.0.0.1', PORT:String(port), SESSION_SECRET:randomBytes(40).toString('hex'), COOKIE_SECRET:randomBytes(40).toString('hex') };
fs.mkdirSync('test-results', { recursive:true });
let child, browser, diagnosticPage; let log = ''; const results = []; const pageErrors = [];
async function start() {
  child = spawn(process.execPath, ['dist/server.cjs'], { env, stdio:['ignore','pipe','pipe'], windowsHide:true });
  child.stdout.on('data', b => log += b); child.stderr.on('data', b => log += b);
  for (let i=0; i<100; i++) {
    try { if ((await fetch(base+'/api/health')).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error('Server startup failed: '+log);
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('Startup timeout');
}
async function stop() { if (child && child.exitCode === null) { const ended = new Promise(r=>child.once('exit',r)); child.kill(); await ended; } }
async function check(name, work) { try { const details = await work(); results.push({name,status:'PASS',details}); console.log('PASS '+name); } catch(e) { results.push({name,status:'FAIL',error:e.message}); console.error('FAIL '+name+': '+e.message); if (diagnosticPage && name.startsWith('ProductPage')) console.log('PAGE DIAGNOSTIC '+JSON.stringify(await diagnosticPage.evaluate(()=>({text:document.body.innerText.slice(0,1000),url:location.href})))); } }
let cookie='';
const api = (url, method='GET', body) => fetch(base+url,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
try {
  await check('production fails before listening for missing secrets or unusable database path',()=>{
    const noSecrets=spawnSync(process.execPath,['dist/server.cjs'],{env:{...env,SESSION_SECRET:'',COOKIE_SECRET:''},encoding:'utf8',timeout:5000,windowsHide:true});
    assert.notEqual(noSecrets.status,0);assert.ok(noSecrets.stderr.includes('FATAL CONFIG ERROR'));
    const blocker=path.join(dir,'not-a-directory');fs.writeFileSync(blocker,'audit fixture');
    const badDb=spawnSync(process.execPath,['dist/server.cjs'],{env:{...env,DATABASE_PATH:path.join(blocker,'db.sqlite')},encoding:'utf8',timeout:5000,windowsHide:true});
    assert.notEqual(badDb.status,0);assert.ok(!badDb.stdout.includes('server running'));assert.ok(!badDb.error,'Must fail promptly rather than time out');
  });
  await start();
  await check('production setup race, login, cookie flags',async()=>{
    const body={username:'audit-owner',password:'Audit-only-password!2026',name:'Audit fixture',email:''};
    const setup=await Promise.all([api('/api/auth/setup','POST',body),api('/api/auth/setup','POST',{...body,username:'audit-second'})]);
    assert.deepEqual(setup.map(r=>r.status).sort(),[201,403]);
    const login=await api('/api/auth/login','POST',{username:'audit-owner',password:body.password});
    // The first submitted setup can finish hashing second; authenticate the winner.
    const response=login.ok ? login : await api('/api/auth/login','POST',{username:'audit-second',password:body.password});
    assert.equal(response.status,200); const header=response.headers.get('set-cookie');
    for(const flag of ['HttpOnly','Secure','SameSite=Strict']) assert.ok(header.includes(flag));
    cookie=header.split(';')[0]; assert.ok(!(await response.text()).includes(cookie.split('=')[1]));
  });
  await check('unknown API, malformed JSON, oversized upload, missing asset',async()=>{
    assert.equal((await api('/api/not-a-route')).status,404);
    const invalid=await fetch(base+'/api/content',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{bad'});assert.equal(invalid.status,400);assert.ok((await invalid.text()).includes('Invalid JSON'));
    const huge=await fetch(base+'/api/media/upload',{method:'POST',headers:{Cookie:cookie,'Content-Type':'image/png'},body:Buffer.alloc(10*1024*1024+1)});assert.equal(huge.status,413);assert.ok((await huge.text()).includes('size limit'));
    assert.equal((await fetch(base+'/uploads/missing.png')).status,404);
  });
  const original=await (await api('/api/content')).json();
  const products=(await (await api('/api/products')).json()).products;
  let uploaded;
  await check('physical upload serving, PDF isolation headers, restart persistence',async()=>{
    const bytes=Buffer.from('%PDF-1.4\n% isolated audit fixture\n%%EOF\n');
    const res=await fetch(base+'/api/media/upload',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/pdf','X-File-Name':encodeURIComponent('../../audit.pdf')},body:bytes});assert.equal(res.status,201);
    uploaded=(await res.json()).media; assert.match(uploaded.filename,/^[a-f0-9-]+\.pdf$/);
    await stop();await start();
    const served=await fetch(base+uploaded.url); assert.equal(served.status,200);assert.equal(served.headers.get('content-disposition'),'attachment');assert.ok(served.headers.get('content-security-policy').includes('sandbox'));assert.deepEqual(Buffer.from(await served.arrayBuffer()),bytes);
    assert.equal((await api('/api/auth/me')).status,200);
  });
  browser=await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || undefined});
  const context=await browser.newContext({ viewport:{width:1440,height:1000} });
  // Transport is loopback HTTP; cookie production flags are checked above.
  await context.addCookies([{name:'polad_session',value:cookie.slice(cookie.indexOf('=')+1),url:base,httpOnly:true,sameSite:'Strict'}]);
  const page=await context.newPage(); diagnosticPage=page; page.setDefaultTimeout(7000); page.on('pageerror',e=>pageErrors.push(e.message));
  await check('local product asset decodability',async()=>{
    await page.goto(base);await page.waitForSelector('#hero-bearing-search-input');
    const urls=[...new Set(products.flatMap(p=>[p.imageUrl,...(p.images||[])]).filter(v=>v?.startsWith('/')))];
    const decoded=await page.evaluate(async urls=>Promise.all(urls.map(url=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({url,ok:true});img.onerror=()=>resolve({url,ok:false});img.src=url;}))),urls);
    fs.writeFileSync('test-results/image-audit.json',JSON.stringify(decoded,null,2));assert.equal(decoded.filter(i=>!i.ok).length,0,JSON.stringify(decoded.filter(i=>!i.ok)));
  });
  for(const lang of ['fa','en']) for(const width of [1440,390]) await check(`public ${lang} width ${width}`,async()=>{
    await page.setViewportSize({width,height:900});await page.goto(base);await page.evaluate(lang=>localStorage.setItem('polad_preferred_language',lang),lang);await page.reload();await page.waitForSelector('#hero-bearing-search-input');
    assert.equal(await page.locator('html').getAttribute('dir'),lang==='fa'?'rtl':'ltr');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2),'Horizontal overflow');
    await page.screenshot({path:`test-results/public-${lang}-${width}.png`,fullPage:true});
    await page.screenshot({path:`test-results/public-${lang}-${width}-viewport.png`});
  });
  for(const tab of ['overview','products','media','inquiries','settings','content','seo','system']) await check('admin route '+tab,async()=>{
    await page.goto(base+'/#admin/'+tab);await page.getByText('Polad Charkhesh Admin', {exact:true}).waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2),'Horizontal overflow');
    await page.screenshot({path:`test-results/admin-${tab}.png`,fullPage:true});
    return (await page.locator('main').innerText()).slice(0,220);
  });
  for(const lang of ['fa','en']) for(const width of [1440,390]) await check(`admin CMS ${lang} width ${width}`,async()=>{
    await page.setViewportSize({width,height:900});await page.goto(base+'/#admin/content');await page.evaluate(lang=>localStorage.setItem('polad_preferred_language',lang),lang);await page.reload();await page.getByRole('heading',{name:/Page Content Management|مدیریت محتوای متنی سایت/}).waitFor();
    assert.equal(await page.locator('html').getAttribute('dir'),lang==='fa'?'rtl':'ltr');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    await page.screenshot({path:`test-results/admin-${lang}-${width}-viewport.png`});
  });
  await check('CMS editor English footer saves and invalid JSON disables save',async()=>{
    await page.goto(base+'/#admin/content');await page.getByRole('button',{name:'Footer & Disclaimer',exact:true}).click();
    await page.locator('label').filter({hasText:'descriptionEn'}).locator('textarea').fill('AUDIT ENGLISH FOOTER UI');
    const saved=page.waitForResponse(r=>r.url().endsWith('/api/content')&&r.request().method()==='PUT');
    await page.getByRole('button',{name:'Save Page Content',exact:true}).click();assert.equal((await saved).status(),200);
    assert.equal((await(await api('/api/content')).json()).content.footer.descriptionEn,'AUDIT ENGLISH FOOTER UI');
    await page.getByRole('button',{name:'Site Sections',exact:true}).click();await page.locator('textarea[rows="10"]').first().fill('[');
    assert.ok(await page.getByRole('button',{name:'Save Page Content',exact:true}).isDisabled());
    await api('/api/content','PUT',original.content);
  });
  await check('nine bilingual CMS sections and SEO survive restart and render',async()=>{
    const patch=structuredClone(original.content);
    for(const [section,value] of Object.entries(patch)) for(const key of Object.keys(value)) if (typeof value[key]==='string' && /Fa$|En$/.test(key)) value[key]='AUDIT-'+section+'-'+key;
    patch.team.members=[{id:'audit-fixture',nameFa:'AUDIT PERSON FA',nameEn:'AUDIT PERSON EN',roleFa:'test',roleEn:'test',experienceFa:'test',experienceEn:'test',specialtyFa:'test',specialtyEn:'test',image:''}];
    assert.equal((await api('/api/content','PUT',patch)).status,200);
    assert.equal((await api('/api/seo','PUT',{defaultTitleFa:'AUDIT SEO FA',defaultTitleEn:'AUDIT SEO EN'})).status,200);
    await stop();await start();assert.deepEqual((await (await api('/api/content')).json()).content,patch);
    for(const lang of ['fa','en']) {
      await page.goto(base);await page.evaluate(lang=>localStorage.setItem('polad_preferred_language',lang),lang);await page.reload();await page.waitForSelector('#hero-bearing-search-input');
      const body=await page.locator('body').innerText();const suffix=lang==='fa'?'Fa':'En';
      for(const section of Object.keys(patch)) assert.ok(body.includes('AUDIT-'+section+'-'),section+' missing in '+lang);
      for(const token of ['hero-description','footer-copyright','footer-disclaimer']) {const [section,key]=token.split('-');assert.ok(body.includes(`AUDIT-${section}-${key}${suffix}`),token+' not rendered');}
      assert.equal(await page.title(),'AUDIT SEO '+lang.toUpperCase());
    }
    await api('/api/content','PUT',original.content);
  });
  await check('ProductPage and Quick View remain accessible',async()=>{
    await page.goto(base+'/product/'+products[0].slug);await page.getByText(products[0].code, {exact:true}).first().waitFor();
    await page.goto(base+'/#catalog');await page.waitForSelector('#hero-bearing-search-input');
    await page.locator('[id^="bearing-card-"]').first().locator('h3').click();await page.waitForSelector('#bearing-spec-modal-card');await page.locator('#close-spec-modal-btn').click();
  });
  await check('production does not display seeded CMS when content API fails',async()=>{
    await page.route('**/api/content',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"audit outage"}'}));await page.goto(base);await page.waitForFunction(()=>document.body.innerText.includes('temporarily unavailable')||document.body.innerText.includes('موقتاً'));
    assert.equal(await page.locator('#hero-bearing-search-input').count(),0);await page.unroute('**/api/content');
  });
  await check('no uncaught browser exceptions',()=>{assert.deepEqual(pageErrors,[]);});
} finally {
  if(browser)await browser.close();await stop();
  fs.writeFileSync('test-results/production-server.log',log);
  fs.writeFileSync('test-results/production-audit.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length}));
process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
