"use strict";

const fs = require("fs");
const path = require("path");
const { dictionary, validateDictionary, listRequired } = require("../server/import/field-dictionary");
const { registry } = require("../server/import/source-registry");
const { detectAdapter } = require("../server/import/source-registry");
const { mapRow, validateCanonical } = require("../server/import/normalize");

const root = path.join(__dirname, "..");
const requiredFiles = [
  "docs/next-phases/data-model/field-dictionary.json",
  "docs/next-phases/import-mapping/field-mapping-matrix.csv",
  "docs/next-phases/source-inventory.csv",
  "docs/next-phases/PHASE20-DATA-DICTIONARY-APPROVAL.md",
  "docs/next-phases/templates/legacy_flat_scout_report.csv",
  "docs/next-phases/templates/uw_style_survey_stops.csv",
  "docs/next-phases/templates/digital_scouting.csv",
  "docs/next-phases/templates/kenya_ipm_surveillance.csv"
];

const errors = [];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing ${file}`);
errors.push(...validateDictionary());
if (dictionary.version !== "1.1.0") errors.push("Unexpected dictionary version");
if (listRequired().length < 4) errors.push("Minimum required field set is incomplete");
if (registry.adapters.length < 4) errors.push("Source adapter registry is incomplete");

const fixtures = [
  ["uw_extension_field_scouting", { Grower: "G", Farm: "F", Scout: "S", Field: "B", Date: "2026-08-11", Crop: "Maize", "Crop Stage": "V6" }],
  ["digital_crop_scouting", { field_name: "B", date_of_observation: "2026-08-11", crop_type: "Tomato", crop_growth_stage: "Flowering" }],
  ["kenya_ipm_surveillance", { farm: "F", field: "B", crop: "Maize", scouting_pattern: "Z-pattern", pest_population: "12" }]
];
for (const [expected, row] of fixtures) {
  const detected = detectAdapter(row);
  if (detected.adapter.id !== expected) errors.push(`Fixture detected ${detected.adapter.id}; expected ${expected}`);
}

const legacy = mapRow({ farmId: "F1", farmName: "Farm", cropType: "Maize", reportDate: "2026-08-11" });
if (validateCanonical(legacy).length) errors.push("Canonical minimum fixture failed validation");

if (errors.length) {
  console.error("PHASE 20 VERIFICATION: FAIL");
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

console.log("PHASE 20 VERIFICATION: PASS");
console.log(`Dictionary version: ${dictionary.version}`);
console.log(`Canonical fields: ${dictionary.fields.length}`);
console.log(`Required baseline fields: ${listRequired().map((f) => f.canonical).join(", ")}`);
console.log(`Source adapters: ${registry.adapters.length}`);
console.log("Source fixtures: 3/3 detected");
console.log("Approval status: ready for Phase 21");
