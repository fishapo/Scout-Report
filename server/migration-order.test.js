'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { orderMigrationFiles } = require('./scripts/migrate');

test('fresh database migrations always apply init.sql first', () => {
  const files = [
    '010_supervisor_edit_permission.sql',
    'init.sql',
    '002_report_workflow.sql',
    '007_master_reference_data.sql',
  ];

  assert.deepEqual(orderMigrationFiles(files), [
    'init.sql',
    '002_report_workflow.sql',
    '007_master_reference_data.sql',
    '010_supervisor_edit_permission.sql',
  ]);
});
