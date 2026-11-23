'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('offline synchronization preserves canonical extensions', () => {
  const form = fs.readFileSync(path.join(__dirname, 'user-form.html'), 'utf8');
  const offline = fs.readFileSync(path.join(__dirname, 'offline.js'), 'utf8');
  const collector = fs.readFileSync(path.join(__dirname, 'offline-extensions.js'), 'utf8');
  const worker = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');

  assert.match(form, /offline-extensions\.js/);
  assert.match(worker, /offline-extensions\.js/);
  assert.match(offline, /collectCanonicalExtensions/);
  assert.match(offline, /item\.extensions/);
  assert.match(offline, /canonical-observations/);
  assert.match(collector, /idPrefix\.slice\(0, 38\)/);
  assert.ok(offline.indexOf('item.extensions') < offline.indexOf('await removePending'));
  for (const domain of ['cropObservations', 'weatherObservations', 'soilObservations', 'irrigationObservations', 'stops']) {
    assert.match(collector, new RegExp(domain));
  }
});
