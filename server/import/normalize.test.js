"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const n = require("./normalize");
const { detectAdapter, getAdapter, resolveAliases } = require("./source-registry");
const { validateDictionary, listRequired } = require("./field-dictionary");

test("normalizes headers and booleans", () => {
  assert.equal(n.normalizeHeader(" Farm Name "), "farm_name");
  assert.equal(n.normalizeBoolean("Yes"), true);
  assert.equal(n.normalizeBoolean("No"), false);
});

test("normalizes percentages and dates", () => {
  assert.equal(n.normalizePercent("12.5%"), 12.5);
  assert.equal(n.normalizeDate("2026-08-11T10:00:00Z"), "2026-08-11");
});

test("validates canonical minimum", () => {
  const e = n.validateCanonical({ farmId: "F1", farmName: "Farm", cropType: "Maize", reportDate: "2026-08-11" });
  assert.deepEqual(e, []);
});

test("detects UW repeated-survey source", () => {
  const result = detectAdapter({ Grower: "G", Farm: "F", Scout: "S", Field: "B", Crop: "Maize", "Crop Stage": "V6" });
  assert.equal(result.adapter.id, "uw_extension_field_scouting");
});

test("detects Kenya IPM source", () => {
  const result = detectAdapter({ farm: "F", field: "B", crop: "Maize", scouting_pattern: "Z-pattern", pest_population: "12", disease_incidence: "3" });
  assert.equal(result.adapter.id, "kenya_ipm_surveillance");
});

test("resolves source aliases into canonical paths", () => {
  const adapter = getAdapter("kenya_ipm_surveillance");
  const aliases = resolveAliases(adapter);
  assert.equal(aliases.pest_population, "pest.count");
  assert.equal(aliases.control_measure, "managementAction");
});

test("canonical dictionary is unique and has required fields", () => {
  assert.deepEqual(validateDictionary(), []);
  assert.ok(listRequired().length >= 4);
});
