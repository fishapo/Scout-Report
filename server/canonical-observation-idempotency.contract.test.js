'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('canonical observation IDs are replay-safe and report-scoped', () => {
  const source = fs.readFileSync(path.join(__dirname, 'canonical-observations.js'), 'utf8');
  assert.match(source, /ON CONFLICT \(id\) DO NOTHING/);
  assert.match(source, /WHERE id=\$1 AND report_id=\$2/);
  assert.match(source, /already used by another report/);
});
