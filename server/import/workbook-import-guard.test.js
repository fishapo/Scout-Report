"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { acquireWorkbookImport } = require("./workbook-import-guard");

test("workbook staging admits at most two concurrent imports and releases slots", () => {
  const releaseOne = acquireWorkbookImport();
  const releaseTwo = acquireWorkbookImport();
  assert.equal(typeof releaseOne, "function");
  assert.equal(typeof releaseTwo, "function");
  assert.equal(acquireWorkbookImport(), null);
  releaseOne();
  const releaseThree = acquireWorkbookImport();
  assert.equal(typeof releaseThree, "function");
  releaseOne();
  releaseTwo();
  releaseThree();
});
