"use strict";

const { ROLES, STAGES } = require("./workflow");

const SUPERVISOR_EDITABLE_STAGES = new Set([STAGES.AWAITING_SUPERVISOR, STAGES.RETURNED_TO_SUPERVISOR]);

function canEditReportData(reportWorkflow, actor) {
  if (!reportWorkflow || !actor) return false;
  if (actor.role === ROLES.ADMIN) return true;
  if (actor.role === ROLES.SCOUT && reportWorkflow.ownerId === actor.id) return true;
  return actor.role === ROLES.INTER_FARM_SUPERVISOR
    && reportWorkflow.currentHolderUserId === actor.id
    && reportWorkflow.supervisorEditAllowed === true
    && SUPERVISOR_EDITABLE_STAGES.has(reportWorkflow.stage);
}

module.exports = { canEditReportData };
