#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const d=fs.readFileSync(path.join(root,"previews","admin-dashboard.html"),"utf8");
const c=fs.readFileSync(path.join(root,"previews","admin-reference.js"),"utf8");
const r=fs.readFileSync(path.join(root,"server/routes/admin/reference.routes.js"),"utf8");
const app=fs.readFileSync(path.join(root,"server/app.js"),"utf8");
const checks=[
["admin client loaded",d.includes('/assets/admin-reference.js')],
["admin client asset route",app.includes('app.get("/assets/admin-reference.js"')],
["management section",d.includes('id="admin-reference-management"')],
["CRUD modal",d.includes('id="crudModal"')],
["farms CRUD",['openReferenceForm(\'farm\')','adminReference.update("farms"','adminReference.create("farms"','adminReference.remove(resource,id)'].every(x=>d.includes(x))],
["crop types CRUD",['adminReference.update("crop-types"','adminReference.create("crop-types"'].every(x=>d.includes(x))],
["varieties CRUD",['createVariety','updateVariety','removeVariety'].every(x=>c.includes(x))],
["pests CRUD",['adminReference.update("pests"','adminReference.create("pests"'].every(x=>d.includes(x))],
["diseases CRUD",['adminReference.update("diseases"','adminReference.create("diseases"'].every(x=>d.includes(x))],
["dependency error handling",d.includes('REFERENCE_IN_USE')],
["204 delete handling",c.includes('response.status === 204')],
["authenticated client",c.includes('fetchWithAuth')],
["public reads preserved",d.includes('`${API}/reference/farms`')&&d.includes('`${API}/reference/diseases`')],
["admin farm route exists",r.includes('router.get("/farms"')],
["no legacy admin page",!d.includes('/admin-reference.html')]
];let p=0;for(const [n,ok] of checks){console.log(`${ok?'✓':'✗'} ${n}`);if(ok)p++}console.log(`Phase 7 static verification: ${p}/${checks.length} passed.`);if(p!==checks.length)process.exit(1);
