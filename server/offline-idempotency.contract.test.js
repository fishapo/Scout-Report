'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('offline submissions have a per-owner idempotency contract', () => {
  const store = fs.readFileSync(path.join(__dirname, 'store.js'), 'utf8');
  const migration = fs.readFileSync(
    path.join(__dirname, 'migrations', '011_offline_submission_idempotency.sql'),
    'utf8'
  );

  assert.match(migration, /client_submission_id/);
  assert.match(migration, /UNIQUE INDEX/);
  assert.match(store, /owner_id = \$1 AND client_submission_id = \$2/);
  assert.match(store, /normalized\.clientSubmissionId/);
});
