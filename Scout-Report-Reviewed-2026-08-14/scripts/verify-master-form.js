"use strict";
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const form = fs.readFileSync(path.join(root, "previews/user-form.html"), "utf8");
const manifest = require(path.join(root, "docs/phase22-master-import/master-reference-data-manifest.json"));
const migration = fs.readFileSync(path.join(root, "server/migrations/007_master_spreadsheet_reference_data.sql"), "utf8");
const checks = [
  ["farm 1", form.includes("FARM 1") || migration.includes("FARM 1")],
  ["farm 12A", migration.includes("FARM 12A")],
  ["farm 12B", migration.includes("FARM 12B")],
  ["no greenhouse farm choice", !form.includes("'GREENHOUSE'") && !form.includes('"GREENHOUSE"')],
  ["Field button", form.includes('data-location="Field"')],
  ["Greenhouse button", form.includes('data-location="Greenhouse"')],
  ["Shadenet button", form.includes('data-location="Shadenet"')],
  ["crop reference", form.includes("REFERENCE_API+'/crop-types'")],
  ["variety reference", form.includes("REFERENCE_API+'/crop-types/") && form.includes("/varieties")],
  ["pest reference", form.includes("REFERENCE_API+'/pests'")],
  ["disease reference", form.includes("REFERENCE_API+'/diseases'")],
  ["location capture", form.includes("navigator.geolocation")],
  ["site type payload", form.includes("locationMode") && form.includes("isGreenhouse:locationType==='Greenhouse'")],
  ["GH starts empty", form.includes('id="gh-value" value=""')],
  ["import/export/print", form.includes("exportMasterCsv()") && form.includes("exportReportJson()") && form.includes("window.print()")],
  ["reference migration", fs.existsSync(path.join(root,"server/migrations/007_master_spreadsheet_reference_data.sql"))],
];
for (const [label, ok] of checks) { if (!ok) throw new Error(`FAIL | ${label}`); console.log(`PASS | ${label}`); }
if (manifest.farm_count !== 13) throw new Error(`Expected 13 farms, got ${manifest.farm_count}`);
if (manifest.crop_type_count < 100) throw new Error(`Expected spreadsheet crop inventory, got ${manifest.crop_type_count}`);
if (manifest.variety_count < 3000) throw new Error(`Expected spreadsheet variety inventory, got ${manifest.variety_count}`);
if (manifest.pest_count !== 14) throw new Error(`Expected 14 pest headings, got ${manifest.pest_count}`);
if (manifest.disease_count !== 12) throw new Error(`Expected 12 disease headings, got ${manifest.disease_count}`);
console.log(`PASS | spreadsheet reference inventory (${manifest.crop_type_count} crops, ${manifest.variety_count} varieties, ${manifest.pest_count} pests, ${manifest.disease_count} diseases)`);
console.log("MASTER FORM INTEGRATION VERIFICATION PASSED");
