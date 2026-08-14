"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");
const {STAGES}=require("./workflow");
const read=(file)=>fs.readFileSync(file,"utf8");

test("Phase 22 declares all twelve canonical repeatable observation domains",()=>{
 const src=read("server/canonical-observations.js");
 for(const domain of ["stops","cropObservations","soilObservations","irrigationObservations","weatherObservations","weeds","nutrients","stress","actions","recommendations","media","samples"]) assert.match(src,new RegExp(domain+":\\s*\\{"));
});

test("Phase 22 enforces required child observation fields",()=>{
 const src=read("server/canonical-observations.js");
 assert.match(src,/weeds:[\s\S]*?required:\s*\["weed_type"\]/);
 assert.match(src,/nutrients:[\s\S]*?required:\s*\["nutrient"\]/);
 assert.match(src,/samples:[\s\S]*?required:\s*\["sample_code"\]/);
});

test("Phase 22 defines six verification checklist items",()=>{
 const src=read("server/verification-checklist.js");
 for(const key of ["identity","crop","observations","evidence","actions","quality"]) assert.match(src,new RegExp('\\["'+key+'"'));
});

test("returned workflow stages map to active verification gates",()=>{
 const src=read("server/verification-checklist.js");
 assert.match(src,/RETURNED_TO_SUPERVISOR\].*?STAGES\.AWAITING_SUPERVISOR/s);
 assert.match(src,/RETURNED_TO_HOD\].*?STAGES\.AWAITING_HOD/s);
 assert.equal(STAGES.RETURNED_TO_SUPERVISOR,"returned_to_supervisor");
 assert.equal(STAGES.RETURNED_TO_HOD,"returned_to_hod");
});

test("Phase 22 registers visit, full-report and checklist routes",()=>{
 const reportRoutes=read("server/routes/report.routes.js");
 const observationRoutes=read("server/routes/canonical-observations.routes.js");
 const checklistRoutes=read("server/routes/verification-checklist.routes.js");
 assert.match(reportRoutes,/"\/:id\/visit"/);
 assert.match(observationRoutes,/"\/:id\/full"/);
 assert.match(checklistRoutes,/"\/:id\/checklist"/);
});
