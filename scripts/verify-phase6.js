#!/usr/bin/env node
"use strict";
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'); const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[]; const check=(n,p,d)=>checks.push({n,pass:!!p,d});
const routes=read('server/routes/admin/reference.routes.js'); const controller=read('server/controllers/admin/reference.controller.js'); const store=read('server/store.js'); const migration=read('server/migrations/init.sql'); const publicRoutes=read('server/routes/reference.routes.js');
const hashes=read('docs/admin-crud/PHASE1-FILE-HASHES.sha256');
for(const m of ['get','post','patch','delete']) check(`disease admin ${m} route`,new RegExp(`router\\.${m}\\(\\s*["']\\/diseases`).test(routes),`${m} /diseases route exists`);
check('admin authentication middleware',/auth\.authenticate/.test(routes),'authentication required'); check('admin role middleware',/auth\.authorizeRoles\(["']admin["']\)/.test(routes),'admin role required');
check('admin route export at end',routes.lastIndexOf('module.exports = router;')>routes.lastIndexOf('router.delete("/diseases/:id"'),'module.exports follows all admin routes');
for(const n of ['listDiseases','getDisease','createDisease','updateDisease','deleteDisease']) check(`controller ${n}`,new RegExp(`(?:async )?function ${n}`).test(controller),`${n} exists`);
for(const n of ['getDiseasesAdmin','findDisease','createDisease','updateDisease','deleteDisease']) check(`store ${n}`,new RegExp(`async function ${n}`).test(store),`${n} exists`);
check('disease schema unique name',/CREATE TABLE IF NOT EXISTS diseases[\s\S]*?name VARCHAR\(255\) NOT NULL UNIQUE/.test(migration),'diseases.name unique constraint');
check('disease observation stores text',/disease_type VARCHAR\(255\) NOT NULL/.test(migration),'historical observations use disease_type text');
const obs=migration.slice(migration.indexOf('-- Disease observations table'),migration.indexOf('-- Indexes for performance'));
check('no disease FK from observations',!/REFERENCES diseases\(id\)/.test(obs),'disease observations do not FK diseases');
check('server generated disease ids',/DISEASE-\$\{String\(nextNumber\)\.padStart\(3, '0'\)\}/.test(store),'DISEASE-### convention');
check('description supported',/description TEXT/.test(migration) && /normalizeDiseaseInput/.test(store),'description supported');
check('public reference router unchanged',crypto.createHash('sha256').update(publicRoutes).digest('hex')===(hashes.match(/^([a-f0-9]+)  server\/routes\/reference\.routes\.js$/m)||['',''])[1],'public scout router unchanged');
for(const f of ['server/store.js','server/controllers/admin/reference.controller.js','server/routes/admin/reference.routes.js','server/disease.store.test.js','server/admin-disease.controller.test.js','scripts/verify-phase6.js']){try{execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'ignore'});check(`syntax ${f}`,true,'node --check passed')}catch{check(`syntax ${f}`,false,'node --check failed')}}
const failed=checks.filter(x=>!x.pass); console.log('Scout Report — Phase 6 Disease CRUD Verification'); console.log('='.repeat(60)); for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'}  ${c.n}${c.d?' — '+c.d:''}`); console.log('-'.repeat(60)); console.log(`Checks: ${checks.length}\nPassed: ${checks.length-failed.length}\nFailed: ${failed.length}`); if(failed.length) process.exitCode=1;
