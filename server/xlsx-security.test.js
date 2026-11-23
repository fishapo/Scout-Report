"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("XLSX parsing enforces expansion, compression-ratio, and row limits", () => {
  const source = fs.readFileSync(path.join(__dirname, "xlsx-lite.js"), "utf8");
  assert.match(source, /MAX_XML_BYTES\s*=\s*32 \* 1024 \* 1024/);
  assert.match(source, /MAX_TOTAL_XML_BYTES/);
  assert.match(source, /MAX_COMPRESSION_RATIO/);
  assert.match(source, /MAX_WORKSHEET_ROWS\s*=\s*100000/);
  assert.match(source, /compression ratio exceeds/);
  assert.match(source, /worksheet exceeds the supported row limit/);
});
