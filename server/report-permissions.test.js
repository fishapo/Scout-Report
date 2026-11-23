"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { canEditReportData } = require("./report-permissions");
const { ROLES, STAGES } = require("./workflow");
const base = { ownerId: "scout-1", currentHolderUserId: "supervisor-1", stage: STAGES.AWAITING_SUPERVISOR, supervisorEditAllowed: false };
test("report edits require ownership, admin authority, or explicit supervisor consent", () => {
  assert.equal(canEditReportData(base, { id: "admin-1", role: ROLES.ADMIN }), true);
  assert.equal(canEditReportData(base, { id: "scout-1", role: ROLES.SCOUT }), true);
  assert.equal(canEditReportData(base, { id: "scout-2", role: ROLES.SCOUT }), false);
  assert.equal(canEditReportData(base, { id: "supervisor-1", role: ROLES.INTER_FARM_SUPERVISOR }), false);
  assert.equal(canEditReportData({ ...base, supervisorEditAllowed: true }, { id: "supervisor-1", role: ROLES.INTER_FARM_SUPERVISOR }), true);
  assert.equal(canEditReportData({ ...base, supervisorEditAllowed: true }, { id: "supervisor-2", role: ROLES.INTER_FARM_SUPERVISOR }), false);
  assert.equal(canEditReportData({ ...base, supervisorEditAllowed: true, stage: STAGES.AWAITING_HOD }, { id: "supervisor-1", role: ROLES.INTER_FARM_SUPERVISOR }), false);
  assert.equal(canEditReportData({ ...base, supervisorEditAllowed: true, currentHolderUserId: "hod-1", stage: STAGES.AWAITING_HOD }, { id: "hod-1", role: ROLES.HEAD_OF_DEPARTMENT }), false);
});
