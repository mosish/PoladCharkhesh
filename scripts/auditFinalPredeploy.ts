import './testDatabase';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { CONFIG } from '../server/config';
import { getDatabase } from '../server/db';
import { hashPassword, createSession } from '../server/auth';
import { productDb } from '../server/services/productDb';
import { contentDb } from '../server/services/contentDb';
import { systemDb } from '../server/services/systemDb';
import { mediaDb } from '../server/services/mediaDb';
import { bearingProducts } from '../src/data/products';
import { authRouter } from '../server/routes/authRoutes';
import { productRouter } from '../server/routes/productRoutes';
import { contentRouter } from '../server/routes/contentRoutes';
import { seoRouter } from '../server/routes/seoRoutes';
import { companyRouter } from '../server/routes/companyRoutes';
import { systemRouter } from '../server/routes/systemRoutes';
import { inquiryRouter } from '../server/routes/inquiryRoutes';
import { mediaRouter } from '../server/routes/mediaRoutes';
import { preventPrototypePollution } from '../server/middleware';

assert.notEqual(path.resolve(CONFIG.DATABASE_PATH), path.resolve('data/poladcharkhesh.db'), 'Use runIsolated.mjs');
const db = getDatabase();
const app = express(); app.use(express.json({limit:'15mb'})); app.use(cookieParser()); app.use(preventPrototypePollution);
for (const [route, router] of Object.entries({auth:authRouter,products:productRouter,content:contentRouter,seo:seoRouter,company:companyRouter,system:systemRouter,inquiries:inquiryRouter,media:mediaRouter})) app.use('/api/' + route,router);
const server = app.listen(0,'127.0.0.1'); await new Promise<void>(resolve => server.once('listening',resolve));
const base = 'http://127.0.0.1:' + (server.address() as any).port;
const password='Isolated-audit-only-2026!';
for (const role of ['superadmin','editor']) db.prepare('INSERT INTO admins(id,username,password_hash,name,email,role,created_at) VALUES(?,?,?,?,?,?,?)').run('audit-'+role,'audit-'+role,await hashPassword(password),role,'',role,new Date().toISOString());
const cookie = 'polad_session=' + createSession('audit-superadmin').token;
const editor = 'polad_session=' + createSession('audit-editor').token;
const request = (route:string, method='GET', body?:unknown, session=cookie) => fetch(base+route,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session}:{})},body:body===undefined?undefined:JSON.stringify(body)});
let failed=0;
async function test(name:string, work:()=>Promise<void>|void) {try {await work();console.log('PASS '+name);}catch(e){failed++; console.error('FAIL '+name+': '+(e as Error).message);}}
const original=systemDb.exportSystemSnapshot('audit');
const product=original.products[0];
try {
await test('68 canonical products, duplicate-free, static/SQLite engineering reconciliation',()=>{
 assert.equal(bearingProducts.length,68);assert.equal(original.products.length,68);
 for(const field of ['id','code','slug']) assert.equal(new Set(original.products.map((p:any)=>p[field])).size,68);
 assert.equal(original.products.filter((p:any)=>p.isArchived).length,0);
 const differences: any[] = [];
 for(const p of bearingProducts) {const actual=original.products.find((a:any)=>a.id===p.id); assert.ok(actual);for(const key of ['code','slug','d','D','B','crKn','corKn','speedGreaseRpm','speedOilRpm','calculationFactorE','calculationFactorY','calculationFactorY0','calculationFactorY1','calculationFactorY2','calculationFactorF0']) if (actual[key] !== (p as any)[key]) differences.push({code:p.code,field:key,sqlite:actual[key]??null,static:(p as any)[key]??null});}
 fs.mkdirSync('test-results',{recursive:true}); fs.writeFileSync('test-results/engineering-differences.json',JSON.stringify(differences,null,2));
 assert.equal(differences.length,0,'See test-results/engineering-differences.json');
});
await test('anonymous access and editor restrictions',async()=>{
 for(const route of ['/api/system/backup','/api/inquiries']) assert.equal((await request(route,'GET',undefined,'')).status,401);
 for(const route of ['/api/system/factory-reset','/api/system/restore']) assert.equal((await request(route,'POST',{},editor)).status,403);
 assert.equal((await request('/api/products/'+product.id,'DELETE',undefined,editor)).status,403);
 assert.equal((await request('/api/products/'+product.id,'DELETE')).status,400);
});
await test('archived products excluded from anonymous list and direct route',async()=>{
 await request('/api/products/'+product.id+'/archive','PATCH',{isArchived:true});
 const res=await request('/api/products/'+product.slug,'GET',undefined,'');assert.equal(res.status,404);
 const all=await (await request('/api/products?includeArchived=true','GET',undefined,'')).json();assert.ok(!all.products.some((p:any)=>p.id===product.id));
 await request('/api/products/'+product.id+'/archive','PATCH',{isArchived:false});
});
await test('malformed CMS list rejected without corrupting saved content',async()=>{
 const response=await request('/api/content','PUT',{whyUs:{cards:42}}); const status=response.status;
 contentDb.updatePageContent(original.pageContent,'restore-test');
 assert.equal(status,400);
});
await test('CMS nested field whitelist and full list item shape',async()=>{
 for(const body of [{hero:{rogue:'x'}},{team:{members:[{id:'only-id'}]}},{about:{stats:[null]}},{whyUs:{cards:null}}]) {
  const response=await request('/api/content','PUT',body);contentDb.updatePageContent(original.pageContent,'restore-test');assert.equal(response.status,400,JSON.stringify(body));
 }
});
await test('bilingual CMS edits preserve blanks and unrelated sections',async()=>{
 for(const section of ['hero','about','whyUs','industries','team','catalog','tools','contact','footer']) {
  const source=(original.pageContent as any)[section];const fields=Object.keys(source).filter(k=>/Fa$|En$/.test(k)&&typeof source[k]==='string');
  const patch=Object.fromEntries(fields.map((k,i)=>[k,i===0?'':'audit-'+section+'-'+k]));
  assert.equal((await request('/api/content','PUT',{[section]:patch})).status,200);
  const read=await (await request('/api/content','GET',undefined,'')).json();
  for(const [key,value] of Object.entries(patch)) assert.equal(read.content[section][key],value);
 }
 contentDb.updatePageContent(original.pageContent,'restore-test');
});
await test('SEO rejects object values',async()=>{
 const result=await request('/api/seo','PUT',{defaultTitleFa:{unsafe:1}});
 db.prepare("UPDATE seo_config SET data=? WHERE id='main'").run(JSON.stringify(original.seoConfig));
 assert.equal(result.status,400);
});
await test('company rejects invalid types and executable links before persistence',async()=>{
 for(const body of [{primaryPhone:42},{socialLinks:[null]},{maps:{google:'javascript:alert(1)'}},{workingHoursConfig:{openTime:42}}]) {
  const result=await request('/api/company','PUT',body);
  db.prepare("UPDATE company_info SET data=? WHERE id='main'").run(JSON.stringify(original.companyInfo));
  assert.equal(result.status,400,JSON.stringify(body));
 }
});
await test('media identity and duplicate references cannot be changed',async()=>{
 const created=await (await request('/api/media','POST',{url:'https://example.invalid/immutable.png',originalName:'immutable.png',mimeType:'image/png'})).json();
 assert.equal((await request('/api/media/'+created.media.id,'PUT',{url:'https://example.invalid/replaced.png'})).status,409);
 assert.equal((await request('/api/media','POST',{url:created.media.url,originalName:'alias.png',mimeType:'image/png'})).status,409);
});
await test('media executable URLs and local aliases rejected',async()=>{
 for(const url of ['javascript:alert(1)','//evil.invalid/a.png','/uploads/../uploads/photo.png','/uploads/photo.png?alias=1']) {
  const res=await request('/api/media','POST',{originalName:'unsafe.png',mimeType:'image/png',url});assert.equal(res.status,400,url);
 }
});
await test('gallery rejects unsafe PDFs and invalid reorder',async()=>{
 const result=await request('/api/media/products/'+product.id,'PATCH',{action:'setPdf',mediaUrl:'javascript:alert(1)'});
 db.prepare('UPDATE products SET pdf_url=? WHERE id=?').run(product.pdfUrl||null,product.id);
 assert.equal(result.status,400);
 assert.equal((await request('/api/media/products/'+product.id,'PATCH',{action:'move',mediaUrl:product.imageUrl,toIndex:-1})).status,400);
});
await test('restore validates every domain before mutation',async()=>{
 const res=await request('/api/system/restore','POST',{...original,pageContent:{whyUs:{cards:'broken'}},media:[{id:'bad',url:'javascript:alert(1)'}]});
 assert.equal(res.status,400);
});
await test('full backup roundtrip retains product, media, inquiry IDs and values',async()=>{
 const media=mediaDb.createMediaRecord({url:'https://example.invalid/audit.png',originalName:'audit.png',mimeType:'image/png',sizeBytes:12},'audit');
 const inquiry=await (await request('/api/inquiries','POST',{fullName:'Audit fixture',phone:'00000000',message:'test only'},'')).json();
 const snapshot=await (await request('/api/system/backup')).json();
 assert.ok(snapshot.media.some((m:any)=>m.id===media.id));assert.ok(snapshot.inquiries.some((q:any)=>q.id===inquiry.id));
 assert.ok(!JSON.stringify(snapshot).includes('password_hash'));
 assert.equal((await request('/api/system/restore','POST',snapshot)).status,200);
 assert.ok(mediaDb.getMediaById(media.id));assert.ok(db.prepare('SELECT id FROM inquiries WHERE id=?').get(inquiry.id));
});
await test('factory reset records recoverable pre-reset snapshot',async()=>{
 const before=Number((db.prepare('SELECT COUNT(*) AS n FROM backup_snapshots').get() as any).n);
 const res=await request('/api/system/factory-reset','POST',{});assert.equal(res.status,200);
 assert.equal(Number((db.prepare('SELECT COUNT(*) AS n FROM backup_snapshots').get() as any).n),before+1);
 assert.equal(productDb.getAllProducts(true).length,68);
});
await test('password change revokes other sessions and preserves the current session',async()=>{
 const other=createSession('audit-superadmin').token;
 assert.equal((await request('/api/auth/change-password','POST',{currentPassword:password,newPassword:password+'new'})).status,200);
 assert.equal((await request('/api/auth/me')).status,200);
 assert.equal((await request('/api/auth/me','GET',undefined,'polad_session='+other)).status,401);
});
} finally {server.close(); db.close();}
console.log('Independent audit: '+failed+' failed checks');
process.exitCode=failed?1:0;
