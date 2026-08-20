"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const storeSource = fs.readFileSync(path.join(__dirname, "store.js"), "utf8");
const initSource = fs.readFileSync(path.join(__dirname, "migrations", "init.sql"), "utf8");
const expandedSource = fs.readFileSync(path.join(__dirname, "migrations", "004_expanded_scouting_model.sql"), "utf8");
const masterSource = fs.readFileSync(path.join(__dirname, "migrations", "007_master_reference_data.sql"), "utf8");
const provenanceSource = fs.readFileSync(path.join(__dirname, "migrations", "008_phase23_canonical_provenance.sql"), "utf8");
const composeSource = fs.readFileSync(path.join(root, "docker-compose.yml"), "utf8");

function reportInsertContract() {
  const match = storeSource.match(/INSERT INTO scout_reports \(\s*([\s\S]*?)\s*\)\s*VALUES \(([^;]*?)\)/);
  assert.ok(match, "scout_reports INSERT must be discoverable");
  const columns = match[1].split(",").map((value) => value.trim()).filter(Boolean);
  const placeholders = match[2].match(/\$\d+/g) || [];
  return { columns, placeholders };
}

test("scout_reports INSERT has one value expression for every target column", () => {
  const { columns, placeholders } = reportInsertContract();
  assert.equal(columns.length, 33);
  assert.equal(placeholders.length, 33);
  assert.deepEqual(placeholders.map((value) => Number(value.slice(1))), Array.from({ length: 33 }, (_, i) => i + 1));
});

test("report INSERT canonical columns are provided by the migration chain", () => {
  const required = [
    "organisation_id", "grower_name", "scout_name", "field_name", "field_area",
    "field_area_unit", "growth_stage", "planting_date", "expected_harvest_date",
    "visit_purpose", "scouting_pattern", "visit_started_at", "visit_ended_at",
    "master_observations", "canonical_payload",
  ];
  const migrationText = `${initSource}\n${expandedSource}\n${masterSource}\n${provenanceSource}`;
  for (const column of required) assert.match(migrationText, new RegExp(`\\b${column}\\b`), `missing migration contract for ${column}`);
});

test("Docker PostgreSQL initialization runs the complete migration directory", () => {
  assert.match(composeSource, /\.\/server\/migrations:\/docker-entrypoint-initdb\.d/);
});
