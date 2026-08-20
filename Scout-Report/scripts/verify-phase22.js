"use strict";
const fs = require("fs");
const path = require("path");
const checks = [
  ["005 checklist migration", "server/migrations/005_phase22_verification_checklists.sql"],
  ["canonical observation service", "server/canonical-observations.js"],
  ["canonical observation controller", "server/controllers/canonical-observations.controller.js"],
  ["canonical observation routes", "server/routes/canonical-observations.routes.js"],
  ["verification checklist service", "server/verification-checklist.js"],
  ["verification checklist controller", "server/controllers/verification-checklist.controller.js"],
  ["verification checklist routes", "server/routes/verification-checklist.routes.js"],
  ["Phase 22 API registration", "server/routes/index.js"],
  ["workflow checklist gate", "server/workflow.store.js"],
  ["API extension plan", "docs/next-phases/architecture/API-EXTENSION-PLAN.md"],
];
let pass=0;
for(const [label,file] of checks){if(!fs.existsSync(path.join(process.cwd(),file))) throw new Error(`FAIL: ${label}`); pass++; console.log(`PASS | ${label}`);}
console.log(`PHASE 22 SOURCE GATE: ${pass}/${checks.length} PASS`);
