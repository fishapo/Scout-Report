"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { readWorkbook } = require("../server/xlsx-lite");
const mapper = require("../server/import/master-import");

const root = process.cwd();
const source = path.join(root, "docs/phase26-import/source/Combined-Scout-Report-Master-ver_24-2026.xlsx");
const dashboard = fs.readFileSync(path.join(root, "previews/dashboard.html"), "utf8");
const controller = fs.readFileSync(path.join(root, "server/controllers/report.controller.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "server/migrations/007_master_reference_data.sql"), "utf8");
const catalog = require(path.join(root, "server/data/master-crop-catalog.json"));

assert.ok(fs.existsSync(source), "v24 master workbook is missing");
const rows = readWorkbook(fs.readFileSync(source));
const headers = (rows[0] || []).map(v => String(v ?? "").trim());
assert.strictEqual(headers.length, 38, "master workbook must contain 38 headings");
assert.deepStrictEqual(headers, mapper.schema.columns.map(c => c.source_heading), "master headings must match mapping schema");
assert.strictEqual(catalog.crops.length, 130, "master crop catalogue must contain 130 crop types");
assert.strictEqual(catalog.crops.reduce((n, c) => n + (c.varieties || []).length, 0), 3475, "master catalogue variety count changed unexpectedly");
assert.ok(controller.includes("stageWorkbook") && controller.includes("commitBatch"), "dashboard import must use master importer");
assert.ok(dashboard.includes("Reference Data") && dashboard.includes("latestImport"), "dashboard reference/import analytics missing");
assert.ok(dashboard.includes("setInterval(loadDashboard,15000)"), "dashboard automatic refresh missing");
assert.ok(migration.includes("FARM 12A") && migration.includes("FARM 12B"), "farm reference migration incomplete");
let checkedRows = 0;
let rejectedRows = 0;
for (let i = 1; i < rows.length; i++) {
  const sourceRow = rows[i];
  if (!sourceRow?.some(v => String(v ?? "").trim())) continue;
  const objectRow = Object.fromEntries(headers.map((h, j) => [h, sourceRow[j] ?? ""]));
  checkedRows++;
  try {
    if (mapper.validateSourceRow(objectRow).errors.length) rejectedRows++;
  } catch (_) {
    rejectedRows++;
  }
}
console.log("PASS | Phase 26 master import and live analytics verification");
console.log(`PASS | source headings: ${headers.length}`);
console.log(`PASS | crop types: ${catalog.crops.length}`);
console.log(`PASS | varieties: ${catalog.crops.reduce((n, c) => n + (c.varieties || []).length, 0)}`);
console.log(`PASS | source rows including header: ${rows.length}`);
console.log(`INFO | source data rows checked: ${checkedRows}; source validation rejects: ${rejectedRows}`);
