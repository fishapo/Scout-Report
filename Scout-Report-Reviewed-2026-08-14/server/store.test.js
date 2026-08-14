const { test } = require('node:test');
const assert = require('node:assert');
const store = require('./store');

test('deriveStatus returns Critical when critical severity present', () => {
  const report = {
    pestObservations: [{ severity: 'Critical' }],
    diseaseObservations: [],
  };
  assert.equal(store.deriveStatus(report), 'Critical');
});

test('deriveStatus returns Completed when no observations', () => {
  const report = { pestObservations: [], diseaseObservations: [] };
  assert.equal(store.deriveStatus(report), 'Completed');
});

test('getReference returns farms and crop types when database is available', { skip: !process.env.RUN_DB_TESTS }, async () => {
  const ref = await store.getReference();
  assert.ok(ref.farms.length >= 3);
  assert.ok(ref.cropTypes.length >= 4);
});
