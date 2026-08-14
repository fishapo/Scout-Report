"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readWorkbook, createWorkbook } = require("./xlsx-lite");
const mapper = require("./import/master-import");
const { canonicalHeaders, canonicalRow, canonicalRecordFromRow, canonicalFromReport } = require("./canonical-report");

const root = path.join(__dirname, "..");
const source = path.join(root, "docs/phase22-master-import/source/Combined-Scout-Report-Master-ver_21-2026.xlsx");
const schema = require("../docs/phase22-master-import/master-import-schema.json");
const dictionary = require("../docs/next-phases/data-model/field-dictionary.json");

test("actual Combined Scout Report Master workbook has the exact 38 source headings", () => {
  const rows = readWorkbook(fs.readFileSync(source));
  assert.equal(rows[0].length, 38);
  assert.deepEqual(rows[0], schema.columns.map(c => c.source_heading));
  assert.equal(rows.length > 1, true);
});

test("all 38 source columns map to recognized application database keys", () => {
  assert.equal(schema.columns.length, 38);
  for (const column of schema.columns) assert.match(column.database_key, /^[a-z0-9_]+$/);
  assert.equal(new Set(schema.columns.map(c => c.database_key)).size, 38);
  const sample = Object.fromEntries(schema.columns.map(c => [c.source_heading, c.database_key === "farm" ? "FARM 1" : c.database_key === "crop" ? "Tomato" : c.database_key === "variety" ? "Cherry" : 1]));
  const mapped = mapper.validateSourceRow(sample);
  assert.deepEqual(mapped.errors, []);
  assert.equal(Object.keys(mapped.normalized).filter(k => schema.columns.some(c => c.database_key === k)).length, 38);
});

test("93-field canonical XLSX round trip preserves every canonical field", () => {
  assert.equal(dictionary.fields.length, 93);
  const record = Object.fromEntries(canonicalHeaders().map((field, i) => [field, `VALUE-${i + 1}`]));
  record.farmId = "FARM-001";
  record.farmName = "FARM 1";
  record.cropType = "Tomato";
  record.reportDate = "2026-08-12";
  const workbook = createWorkbook([canonicalHeaders(), canonicalRow(record)], "Canonical Reports");
  const rows = readWorkbook(workbook);
  const roundTripped = canonicalRecordFromRow(rows[0], rows[1]);
  assert.deepEqual(roundTripped, record);
  assert.equal(Object.keys(roundTripped).length, 93);
});

test("canonical report builder emits exactly the approved 93-field dictionary", () => {
  const record = canonicalFromReport({ id: "SR-000001", farmId: "FARM-001", farmName: "FARM 1", cropType: "Tomato", variety: "Cherry", reportDate: "2026-08-12", location: { latitude: 1.1, longitude: 36.2 } });
  assert.equal(Object.keys(record).length, 93);
  assert.deepEqual(Object.keys(record), canonicalHeaders());
});
