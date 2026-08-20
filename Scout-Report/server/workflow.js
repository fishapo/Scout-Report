"use strict";

const ROLES = Object.freeze({
  ADMIN: "admin",
  SCOUT: "scout",
  INTER_FARM_SUPERVISOR: "inter_farm_supervisor",
  HEAD_OF_DEPARTMENT: "head_of_department",
});

const STAGES = Object.freeze({
  DRAFT: "draft",
  AWAITING_SUPERVISOR: "awaiting_supervisor",
  SUPERVISOR_VERIFIED: "supervisor_verified",
  AWAITING_HOD: "awaiting_hod",
  HOD_VERIFIED: "hod_verified",
  AWAITING_ADMIN: "awaiting_admin",
  APPROVED: "approved",
  RETURNED_TO_SCOUT: "returned_to_scout",
  RETURNED_TO_SUPERVISOR: "returned_to_supervisor",
  RETURNED_TO_HOD: "returned_to_hod",
});

const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Administrator",
  [ROLES.SCOUT]: "Field Scout",
  [ROLES.INTER_FARM_SUPERVISOR]: "Inter-Farm Supervisor",
  [ROLES.HEAD_OF_DEPARTMENT]: "Head of Department",
});

function canShare(stage, actorRole, recipientRole) {
  if (actorRole === ROLES.SCOUT &&
      [STAGES.DRAFT, STAGES.RETURNED_TO_SCOUT].includes(stage) &&
      recipientRole === ROLES.INTER_FARM_SUPERVISOR) return true;

  if (actorRole === ROLES.INTER_FARM_SUPERVISOR &&
      stage === STAGES.SUPERVISOR_VERIFIED &&
      recipientRole === ROLES.HEAD_OF_DEPARTMENT) return true;

  if (actorRole === ROLES.HEAD_OF_DEPARTMENT &&
      stage === STAGES.HOD_VERIFIED &&
      recipientRole === ROLES.ADMIN) return true;

  return false;
}

function nextStageAfterShare(stage, actorRole) {
  if (actorRole === ROLES.SCOUT && [STAGES.DRAFT, STAGES.RETURNED_TO_SCOUT].includes(stage)) {
    return STAGES.AWAITING_SUPERVISOR;
  }
  if (actorRole === ROLES.INTER_FARM_SUPERVISOR && stage === STAGES.SUPERVISOR_VERIFIED) {
    return STAGES.AWAITING_HOD;
  }
  if (actorRole === ROLES.HEAD_OF_DEPARTMENT && stage === STAGES.HOD_VERIFIED) {
    return STAGES.AWAITING_ADMIN;
  }
  return null;
}

function verifyTransition(stage, actorRole, decision) {
  const normalized = String(decision || "").trim().toLowerCase();
  if (!['approve', 'reject'].includes(normalized)) return null;

  if (actorRole === ROLES.INTER_FARM_SUPERVISOR && [STAGES.AWAITING_SUPERVISOR, STAGES.RETURNED_TO_SUPERVISOR].includes(stage)) {
    return normalized === 'approve' ? STAGES.SUPERVISOR_VERIFIED : STAGES.RETURNED_TO_SCOUT;
  }
  if (actorRole === ROLES.HEAD_OF_DEPARTMENT && [STAGES.AWAITING_HOD, STAGES.RETURNED_TO_HOD].includes(stage)) {
    return normalized === 'approve' ? STAGES.HOD_VERIFIED : STAGES.RETURNED_TO_SUPERVISOR;
  }
  if (actorRole === ROLES.ADMIN && stage === STAGES.AWAITING_ADMIN) {
    return normalized === 'approve' ? STAGES.APPROVED : STAGES.RETURNED_TO_HOD;
  }
  return null;
}

function expectedVerifierRole(stage) {
  if ([STAGES.AWAITING_SUPERVISOR, STAGES.RETURNED_TO_SUPERVISOR].includes(stage)) return ROLES.INTER_FARM_SUPERVISOR;
  if ([STAGES.AWAITING_HOD, STAGES.RETURNED_TO_HOD].includes(stage)) return ROLES.HEAD_OF_DEPARTMENT;
  if (stage === STAGES.AWAITING_ADMIN) return ROLES.ADMIN;
  return null;
}

function expectedRecipientRole(stage, actorRole) {
  if (canShare(stage, actorRole, ROLES.INTER_FARM_SUPERVISOR)) return ROLES.INTER_FARM_SUPERVISOR;
  if (canShare(stage, actorRole, ROLES.HEAD_OF_DEPARTMENT)) return ROLES.HEAD_OF_DEPARTMENT;
  if (canShare(stage, actorRole, ROLES.ADMIN)) return ROLES.ADMIN;
  return null;
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

module.exports = {
  ROLES,
  STAGES,
  ROLE_LABELS,
  canShare,
  nextStageAfterShare,
  verifyTransition,
  expectedVerifierRole,
  expectedRecipientRole,
  roleLabel,
};
