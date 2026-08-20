#!/usr/bin/env node
"use strict";
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[]; const check=(n,p,d)=>checks.push({n,pass:!!p,d});
const routes=read('server/routes/admin/reference.routes.js');
const controller=read('server/controllers/admin/reference.controller.js');
const store=read('server/store.js');
const migration=read('server/migrations/init.sql');
const publicRoutes=read('server/routes/reference.routes.js');
const hashes=read('docs/admin-crud/PHASE1-FILE-HASHES.sha256');
for(const m of ['get','post','patch','delete']) check(`pest admin ${m} route`,new RegExp(`router\\.${m}\\(\\s*["']\\/pests`).test(routes),`${m} /pests route exists`);
check('admin authentication middleware',/auth\.authenticate/.test(routes),'authentication required');
check('admin role middleware',/auth\.authorizeRoles\(["']admin["']\)/.test(routes),'admin role required');
check('pest routes exported after all route declarations',routes.lastIndexOf('module.exports = router;')>routes.lastIndexOf('router.delete("/pests/:id"'),'module.exports is after pest routes');
for(const n of ['listPests','getPest','createPest','updatePest','deletePest']) check(`controller ${n}`,new RegExp(`(?:async )?function ${n}`).test(controller),`${n} exists`);
for(const n of ['getPestsAdmin','findPest','createPest','updatePest','deletePest']) check(`store ${n}`,new RegExp(`async function ${n}`).test(store),`${n} exists`);
check('pest schema unique name',/name VARCHAR\(255\) NOT NULL UNIQUE/.test(migration),'pests.name unique constraint');
check('pest observation stores text',/pest_type VARCHAR\(255\) NOT NULL/.test(migration),'historical observations use pest_type text');
check('no pest FK from observations',!/REFERENCES pests\(id\)/.test(migration.slice(migration.indexOf('-- Pest observations table'), migration.indexOf('-- Disease observations table'))),'pest observations do not FK pests');
check('server generated pest ids',/PEST-\$\{String\(nextNumber\)\.padStart\(3, '0'\)\}/.test(store),'PEST-### convention');
check('description supported',/description TEXT/.test(migration) && /description/.test(store),'description supported');
check('public reference router unchanged',crypto.createHash('sha256').update(publicRoutes).digest('hex')===(hashes.match(/^([a-f0-9]+)  server\/routes\/reference\.routes\.js$/m)||['',''])[1],'public scout router unchanged');
for(const f of ['server/store.js','server/controllers/admin/reference.controller.js','server/routes/admin/reference.routes.js','server/pest.store.test.js','server/admin-pest.controller.test.js','scripts/verify-phase5.js']){try{execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'ignore'});check(`syntax ${f}`,true,'node --check passed')}catch{check(`syntax ${f}`,false,'node --check failed')}}
const failed=checks.filter(x=>!x.pass);console.log('Scout Report — Phase 5 Pest CRUD Verification');console.log('='.repeat(60));for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'}  ${c.n}${c.d?' — '+c.d:''}`);console.log('-'.repeat(60));console.log(`Checks: ${checks.length}\nPassed: ${checks.length-failed.length}\nFailed: ${failed.length}`);if(failed.length)process.exitCode=1;
