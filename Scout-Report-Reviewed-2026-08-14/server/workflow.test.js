"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ROLES,
  STAGES,
  canShare,
  nextStageAfterShare,
  verifyTransition,
  expectedVerifierRole,
} = require("./workflow");

test("workflow enforces scout -> supervisor -> HOD -> admin sharing order", () => {
  assert.equal(canShare(STAGES.DRAFT, ROLES.SCOUT, ROLES.INTER_FARM_SUPERVISOR), true);
  assert.equal(nextStageAfterShare(STAGES.DRAFT, ROLES.SCOUT), STAGES.AWAITING_SUPERVISOR);
  assert.equal(canShare(STAGES.DRAFT, ROLES.SCOUT, ROLES.HEAD_OF_DEPARTMENT), false);
  assert.equal(canShare(STAGES.SUPERVISOR_VERIFIED, ROLES.INTER_FARM_SUPERVISOR, ROLES.HEAD_OF_DEPARTMENT), true);
  assert.equal(nextStageAfterShare(STAGES.SUPERVISOR_VERIFIED, ROLES.INTER_FARM_SUPERVISOR), STAGES.AWAITING_HOD);
  assert.equal(canShare(STAGES.HOD_VERIFIED, ROLES.HEAD_OF_DEPARTMENT, ROLES.ADMIN), true);
  assert.equal(nextStageAfterShare(STAGES.HOD_VERIFIED, ROLES.HEAD_OF_DEPARTMENT), STAGES.AWAITING_ADMIN);
});

test("workflow requires verification at every review gate", () => {
  assert.equal(expectedVerifierRole(STAGES.AWAITING_SUPERVISOR), ROLES.INTER_FARM_SUPERVISOR);
  assert.equal(verifyTransition(STAGES.AWAITING_SUPERVISOR, ROLES.INTER_FARM_SUPERVISOR, "approve"), STAGES.SUPERVISOR_VERIFIED);
  assert.equal(verifyTransition(STAGES.AWAITING_SUPERVISOR, ROLES.INTER_FARM_SUPERVISOR, "reject"), STAGES.RETURNED_TO_SCOUT);
  assert.equal(verifyTransition(STAGES.RETURNED_TO_SUPERVISOR, ROLES.INTER_FARM_SUPERVISOR, "approve"), STAGES.SUPERVISOR_VERIFIED);
  assert.equal(verifyTransition(STAGES.AWAITING_HOD, ROLES.HEAD_OF_DEPARTMENT, "approve"), STAGES.HOD_VERIFIED);
  assert.equal(verifyTransition(STAGES.AWAITING_HOD, ROLES.HEAD_OF_DEPARTMENT, "reject"), STAGES.RETURNED_TO_SUPERVISOR);
  assert.equal(verifyTransition(STAGES.RETURNED_TO_HOD, ROLES.HEAD_OF_DEPARTMENT, "approve"), STAGES.HOD_VERIFIED);
  assert.equal(verifyTransition(STAGES.AWAITING_ADMIN, ROLES.ADMIN, "approve"), STAGES.APPROVED);
  assert.equal(verifyTransition(STAGES.AWAITING_ADMIN, ROLES.ADMIN, "reject"), STAGES.RETURNED_TO_HOD);
  assert.equal(verifyTransition(STAGES.AWAITING_ADMIN, ROLES.INTER_FARM_SUPERVISOR, "approve"), null);
});
