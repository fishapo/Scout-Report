#!/usr/bin/env node
"use strict";
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const checks=[];
const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const routes=read('server/routes/admin/reference.routes.js'), controller=read('server/controllers/admin/reference.controller.js'), store=read('server/store.js'), index=read('server/routes/index.js'), publicRoutes=read('server/routes/reference.routes.js');
const hashes=read('docs/admin-crud/PHASE1-FILE-HASHES.sha256');
check('crop admin router routes exist', ['get','post','patch','delete'].every(m=>new RegExp(`router\\.${m}\\(\\s*["'].*crop-types`).test(routes)),'all crop-type CRUD verbs are mounted');
check('admin authentication middleware',/auth\.authenticate/.test(routes),'authentication required');
check('admin role middleware',/auth\.authorizeRoles\(["']admin["']\)/.test(routes),'admin role required');
for(const n of ['listCropTypes','getCropType','createCropType','updateCropType','deleteCropType']) check(`controller ${n}`,new RegExp(n).test(controller)&&new RegExp(`store\\.${n.replace('listCropTypes','getCropTypesAdmin')}`).test(controller),`${n} delegates to store`);
check('crop type id generation',/CROP-\$\{String\(nextNumber\)\.padStart\(3, '0'\)\}/.test(store),'server generates CROP-### IDs');
check('crop delete row lock',/SELECT id FROM crop_types WHERE id = \$1 FOR UPDATE/.test(store),'parent row locked before dependency check');
check('crop variety dependency check',/FROM crop_varieties WHERE crop_type_id = \$1/.test(store),'child varieties counted before delete');
check('dependency conflict response',/REFERENCE_IN_USE/.test(controller)&&/status\(409\)/.test(controller),'referenced crop types return 409');
check('missing response',/REFERENCE_NOT_FOUND/.test(controller)&&/status\(404\)/.test(controller),'missing crop types return 404');
check('successful delete',/status\(204\)\.end/.test(controller),'successful delete returns 204');
check('public reference router unchanged',crypto.createHash('sha256').update(publicRoutes).digest('hex')===(hashes.match(/^([a-f0-9]+)  server\/routes\/reference\.routes\.js$/m)||['',''])[1],'scout-facing reference router remains byte-for-byte unchanged');
check('public reference mount remains',/router\.use\(\s*["']\/reference["']\s*,\s*referenceRoutes\s*\)/s.test(index),'public reference mount remains');
for(const f of ['server/store.js','server/controllers/admin/reference.controller.js','server/routes/admin/reference.routes.js','server/crop-type.store.test.js','server/admin-crop-type.controller.test.js','scripts/verify-phase3.js']){try{execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'ignore'});check(`syntax ${f}`,true,'node --check passed')}catch{check(`syntax ${f}`,false,'node --check failed')}}
const fails=checks.filter(x=>!x.pass); console.log('Scout Report — Phase 3 Crop Type CRUD Verification'); console.log('='.repeat(58)); for(const c of checks) console.log(`${c.pass?'PASS':'FAIL'}  ${c.name}${c.detail?' — '+c.detail:''}`); console.log('-'.repeat(58)); console.log(`Checks: ${checks.length}\nPassed: ${checks.length-fails.length}\nFailed: ${fails.length}`); if(fails.length)process.exitCode=1;
