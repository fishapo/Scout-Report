#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "server/migrations/init.sql"), "utf8");
const routes = fs.readFileSync(path.join(root, "server/routes/reference.routes.js"), "utf8");
const indexRoutes = fs.readFileSync(path.join(root, "server/routes/index.js"), "utf8");
const controller = fs.readFileSync(path.join(root, "server/controllers/reference.controller.js"), "utf8");
const auth = fs.readFileSync(path.join(root, "server/auth.js"), "utf8");
const store = fs.readFileSync(path.join(root, "server/store.js"), "utf8");

const checks = [];
function check(name, condition, detail) {
  checks.push({ name, pass: Boolean(condition), detail });
}

const requiredTables = [
  "farms",
  "crop_types",
  "crop_varieties",
  "pests",
  "diseases",
  "scout_reports",
  "pest_observations",
  "disease_observations",
];
for (const table of requiredTables) {
  check(`table: ${table}`, new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\s*\\(`, "i").test(migration), "reference/report table exists in init.sql");
}

check("farm name uniqueness", /name VARCHAR\(255\) NOT NULL UNIQUE/i.test(migration.split("-- Crop types table")[0]), "farms.name has a database UNIQUE constraint");
check("crop type name uniqueness", /CREATE TABLE IF NOT EXISTS crop_types[\s\S]*?name VARCHAR\(255\) NOT NULL UNIQUE/i.test(migration), "crop_types.name is unique");
check("variety parent foreign key", /crop_type_id VARCHAR\(50\) NOT NULL REFERENCES crop_types\(id\) ON DELETE CASCADE/i.test(migration), "crop_varieties.parent -> crop_types with cascade");
check("variety scoped uniqueness", /UNIQUE \(crop_type_id, name\)/i.test(migration), "variety names are unique within crop type");
check("pest name uniqueness", /CREATE TABLE IF NOT EXISTS pests[\s\S]*?name VARCHAR\(255\) NOT NULL UNIQUE/i.test(migration), "pests.name is unique");
check("disease name uniqueness", /CREATE TABLE IF NOT EXISTS diseases[\s\S]*?name VARCHAR\(255\) NOT NULL UNIQUE/i.test(migration), "diseases.name is unique");
check("farm report cascade risk", /farm_id VARCHAR\(50\) NOT NULL REFERENCES farms\(id\) ON DELETE CASCADE/i.test(migration), "scout_reports.farm_id cascades on farm delete; admin delete must be guarded");
check("pest observations use names", /pest_type VARCHAR\(255\) NOT NULL/i.test(migration), "pest observations currently store pest_type text");
check("disease observations use names", /disease_type VARCHAR\(255\) NOT NULL/i.test(migration), "disease observations currently store disease_type text");

const stableEndpoints = [
  ["GET", "/farms", /router\.get\(\s*["']\/farms["']/],
  ["GET", "/crop-types", /router\.get\(\s*["']\/crop-types["']/],
  ["GET", "/crop-types/:id/varieties", /router\.get\(\s*["']\/crop-types\/\:id\/varieties["']/],
  ["GET", "/pests", /router\.get\(\s*["']\/pests["']/],
  ["GET", "/diseases", /router\.get\(\s*["']\/diseases["']/],
];
for (const [method, endpoint, pattern] of stableEndpoints) {
  check(`stable reference route: ${method} ${endpoint}`, pattern.test(routes), "existing scout-facing route remains present");
}
check("reference router remains mounted", /router\.use\(\s*["']\/reference["']\s*,\s*referenceRoutes\s*\)/s.test(indexRoutes), "canonical /api/reference mount remains intact");
check("reference controller uses active store", /require\(["']\.\.\/store["']\)/.test(controller), "reference reads remain backed by server/store.js");
check("reference response contract remains raw", /res\.json\(await store\.getReference\(\)\)/.test(controller) && /res\.json\(farms\)/.test(controller), "controller returns arrays/objects directly");
check("admin role exists", /new Set\(\["admin", "scout"\]\)/.test(auth), "admin/scout role model exists");
check("admin authorization middleware exists", /function authorizeRoles\(\.\.\.roles\)/.test(auth), "existing authorizeRoles middleware can secure new admin routes");
check("active store reads all reference domains", /FROM farms/.test(store) && /FROM crop_types/.test(store) && /FROM crop_varieties/.test(store) && /FROM pests/.test(store) && /FROM diseases/.test(store), "store.js contains current reference reads");

const adminRouteExists = fs.existsSync(path.join(root, "server/routes/admin/reference.routes.js"));
check("admin CRUD remains isolated", !adminRouteExists || /\/api\/admin\/reference|adminReferenceRoutes/.test(indexRoutes + (adminRouteExists ? fs.readFileSync(path.join(root, "server/routes/admin/reference.routes.js"), "utf8") : "")), "admin CRUD may be added without replacing the scout-facing reference router");

const failures = checks.filter((c) => !c.pass);
console.log("Scout Report — Phase 1 Schema & Dependency Verification");
console.log("=========================================================");
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
  if (c.detail) console.log(`      ${c.detail}`);
}
console.log("---------------------------------------------------------");
console.log(`Checks: ${checks.length}`);
console.log(`Passed: ${checks.length - failures.length}`);
console.log(`Failed: ${failures.length}`);

if (failures.length) process.exitCode = 1;
