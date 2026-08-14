"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "server/migrations/004_expanded_scouting_model.sql"), "utf8");
const dictionary = require(path.join(root, "docs/next-phases/data-model/field-dictionary.json"));

const requiredTables = [
  "report_survey_stops",
  "crop_observations",
  "soil_observations",
  "irrigation_observations",
  "weather_observations",
  "weed_observations",
  "nutrient_observations",
  "stress_observations",
  "management_actions",
  "recommendations",
  "report_media",
  "diagnostic_samples",
  "report_import_batches",
  "report_import_rows",
];

const requiredHeaderColumns = [
  "organisation_id", "grower_name", "scout_name", "field_name", "field_area",
  "field_area_unit", "growth_stage", "planting_date", "expected_harvest_date",
  "visit_purpose", "scouting_pattern", "visit_started_at", "visit_ended_at",
];

const requiredExpandedColumns = {
  pest_observations: ["scientific_name", "life_stage", "sampling_method", "sample_size", "sample_unit", "damage_type", "economic_threshold", "beneficial_present", "survey_stop_id", "management_recommended"],
  disease_observations: ["scientific_name", "incidence_percent", "symptom_type", "plant_part", "diagnostic_confidence", "survey_stop_id", "management_recommended"],
};

const failures = [];
function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(migration.includes("BEGIN;") && migration.includes("COMMIT;"), "Migration must be transactional");
for (const table of requiredTables) {
  expect(new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\b`, "i").test(migration), `Missing table: ${table}`);
}
for (const column of requiredHeaderColumns) {
  expect(new RegExp(`ADD COLUMN IF NOT EXISTS\\s+${column}\\b`, "i").test(migration), `Missing scout_reports column: ${column}`);
}
for (const [table, columns] of Object.entries(requiredExpandedColumns)) {
  for (const column of columns) {
    expect(new RegExp(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS\\s+${column}\\b`, "i").test(migration), `Missing ${table}.${column}`);
  }
}

expect(dictionary.status === "phase20-approved-for-phase21", "Dictionary is not approved for Phase 21");
expect(dictionary.fields.length >= 90, `Expected >=90 canonical fields, found ${dictionary.fields.length}`);
expect(migration.includes("REFERENCES scout_reports(id) ON DELETE CASCADE"), "Expanded tables must remain report-owned");
expect(migration.includes("REFERENCES report_survey_stops(id) ON DELETE SET NULL"), "Observation tables must support survey-stop linkage");
expect(migration.includes("JSONB"), "Import provenance must preserve source/normalized payloads");
expect(migration.includes("file_sha256 CHAR(64)"), "Import batches must preserve file provenance");
expect(migration.includes("CREATE INDEX IF NOT EXISTS"), "Migration must define query indexes");
expect(migration.includes("ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS"), "Migration must preserve legacy scout_reports columns");

if (failures.length) {
  console.error("Phase 21 verification FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Phase 21 verification PASSED");
console.log(`Canonical fields: ${dictionary.fields.length}`);
console.log(`Expanded tables: ${requiredTables.length}`);
console.log(`Header extensions: ${requiredHeaderColumns.length}`);
console.log("Legacy compatibility: PASS");
console.log("Import provenance: PASS");
console.log("Workflow ownership references: PASS");
