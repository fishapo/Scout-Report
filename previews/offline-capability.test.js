"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("scout form provides cached offline capture and automatic synchronization", () => {
  const form = fs.readFileSync(path.join(__dirname, "user-form.html"), "utf8");
  const offline = fs.readFileSync(path.join(__dirname, "offline.js"), "utf8");
  const worker = fs.readFileSync(path.join(__dirname, "service-worker.js"), "utf8");
  assert.match(form, /id="offline-status"/);
  assert.match(form, /\/assets\/offline\.js/);
  assert.match(offline, /indexedDB\.open/);
  assert.match(offline, /window\.addEventListener\("online", syncPending\)/);
  assert.match(offline, /\/api\/reports/);
  assert.match(worker, /\/scout-form/);
  assert.match(worker, /\/api\/reference/);
});
