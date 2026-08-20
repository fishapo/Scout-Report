"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { TABLES, REPORT_HEADER_FIELDS, getCanonicalModel } = require("./canonical-model");

test("canonical model exposes all Phase 21 child domains", () => {
  const expected = ["surveyStops", "crop", "soil", "irrigation", "weather", "weed", "pest", "disease", "nutrient", "stress", "actions", "recommendations", "media", "samples", "importBatches", "importRows"];
  assert.deepEqual(Object.keys(TABLES), expected);
  assert.equal(new Set(Object.values(TABLES)).size, expected.length);
});

test("canonical model exposes all 13 report-header extensions", () => {
  assert.equal(REPORT_HEADER_FIELDS.length, 13);
  assert.equal(new Set(REPORT_HEADER_FIELDS).size, 13);
  assert.deepEqual(getCanonicalModel().reportHeaderFields, REPORT_HEADER_FIELDS);
});
