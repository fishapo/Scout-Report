#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
function check(name, condition, detail) { checks.push({ name, pass: Boolean(condition), detail }); }

const indexRoutes = read("server/routes/index.js");
const adminRoutes = read("server/routes/admin/reference.routes.js");
const controller = read("server/controllers/admin/reference.controller.js");
const store = read("server/store.js");
const publicRoutes = read("server/routes/reference.routes.js");
const auth = read("server/auth.js");
const phase1Hashes = read("docs/admin-crud/PHASE1-FILE-HASHES.sha256");

check("admin router exists", fs.existsSync(path.join(root, "server/routes/admin/reference.routes.js")), "new isolated admin reference router exists");
check("admin router mounted", /router\.use\(\s*["']\/admin\/reference["']\s*,\s*adminReferenceRoutes\s*\)/s.test(indexRoutes), "canonical /api router mounts admin reference CRUD");
check("admin authentication middleware", /auth\.authenticate/.test(adminRoutes), "admin routes require authentication");
check("admin role middleware", /auth\.authorizeRoles\(["']admin["']\)/.test(adminRoutes), "admin routes require admin role");

for (const method of ["get", "post", "patch", "delete"]) {
  check(`farm ${method.toUpperCase()} route`, new RegExp(`router\\.${method}\\(\\s*["'].*farms`, "s").test(adminRoutes), `farm ${method.toUpperCase()} endpoint is defined`);
}
check("farm list controller", /listFarms/.test(controller) && /store\.getFarms/.test(controller), "list operation delegates to store");
check("farm create controller", /createFarm/.test(controller) && /store\.createFarm/.test(controller), "create operation delegates to store");
check("farm update controller", /updateFarm/.test(controller) && /store\.updateFarm/.test(controller), "update operation delegates to store");
check("farm delete controller", /deleteFarm/.test(controller) && /store\.deleteFarm/.test(controller), "delete operation delegates to store");
check("farm delete conflict", /REFERENCE_IN_USE/.test(controller) && /status\(409\)/.test(controller), "referenced farms return 409");
check("farm delete not-found", /REFERENCE_NOT_FOUND/.test(controller) && /status\(404\)/.test(controller), "missing farms return 404");
check("farm successful delete", /status\(204\)\.end/.test(controller), "successful deletion returns 204");
check("server-generated farm ids", /FARM-\$\{String\(nextNumber\)\.padStart\(3, '0'\)\}/.test(store), "farm IDs are generated server-side");
check("farm delete row lock", /SELECT id FROM farms WHERE id = \$1 FOR UPDATE/.test(store), "farm deletion locks the parent row before dependency check");
check("farm dependency check", /FROM scout_reports WHERE farm_id = \$1/.test(store), "farm deletion checks report dependencies");
check("farm create uniqueness", /23505/.test(store), "database uniqueness conflicts are mapped to 409 by store error handling");
check("public reference router unchanged", crypto.createHash("sha256").update(publicRoutes).digest("hex") === (phase1Hashes.match(/^([a-f0-9]+)  server\/routes\/reference\.routes\.js$/m) || ["", ""])[1], "scout-facing reference route file remains byte-for-byte unchanged from Phase 1");
check("public reference mount remains", /router\.use\(\s*["']\/reference["']\s*,\s*referenceRoutes\s*\)/s.test(indexRoutes), "existing /api/reference mount remains");
check("farm store tests exist", fs.existsSync(path.join(root, "server/farm.store.test.js")), "farm CRUD store regression tests exist");
check("admin controller tests exist", fs.existsSync(path.join(root, "server/admin-reference.controller.test.js")), "admin controller tests exist");

const syntaxFiles = [
  "server/store.js",
  "server/controllers/admin/reference.controller.js",
  "server/routes/admin/reference.routes.js",
  "server/routes/index.js",
  "scripts/verify-phase2.js",
];
for (const file of syntaxFiles) {
  try { execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "ignore" }); check(`syntax: ${file}`, true, "node --check passed"); }
  catch { check(`syntax: ${file}`, false, "node --check failed"); }
}

const failures = checks.filter((c) => !c.pass);
console.log("Scout Report — Phase 2 Admin Reference CRUD Foundation Verification");
console.log("=================================================================");
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
  if (c.detail) console.log(`      ${c.detail}`);
}
console.log("-----------------------------------------------------------------");
console.log(`Checks: ${checks.length}`);
console.log(`Passed: ${checks.length - failures.length}`);
console.log(`Failed: ${failures.length}`);
if (failures.length) process.exitCode = 1;
