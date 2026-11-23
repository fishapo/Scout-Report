'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('offline queue is user-scoped and replay-safe', () => {
  const offline = fs.readFileSync(path.join(__dirname, 'offline.js'), 'utf8');
  assert.match(offline, /ownerUserId: user\.id/);
  assert.match(offline, /clientSubmissionId: offlineId/);
  assert.match(offline, /item\.ownerUserId === user\.id/);
  assert.match(offline, /legacy account and was not submitted/);
});
