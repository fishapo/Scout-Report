"use strict";

const crypto = require("crypto");
const { query } = require("./db");
const { STAGES, expectedVerifierRole } = require("./workflow");

const ITEM_TEMPLATES = Object.freeze([
  ["identity", "Report identity and farm/field information is complete"],
  ["crop", "Crop, variety and growth-stage information is complete"],
  ["observations", "Field observations and measurements are complete"],
  ["evidence", "Supporting evidence/media or a documented reason for absence is complete"],
  ["actions", "Management actions/recommendations are complete or explicitly marked not applicable"],
  ["quality", "Data quality and corrective comments have been reviewed"],
]);

function checklistStageForWorkflow(stage) {
  if ([STAGES.AWAITING_SUPERVISOR, STAGES.RETURNED_TO_SUPERVISOR].includes(stage)) return STAGES.AWAITING_SUPERVISOR;
  if ([STAGES.AWAITING_HOD, STAGES.RETURNED_TO_HOD].includes(stage)) return STAGES.AWAITING_HOD;
  if (stage === STAGES.AWAITING_ADMIN) return STAGES.AWAITING_ADMIN;
  return stage;
}

async function ensureChecklist(reportId, stage, db = { query }) {
  const normalizedStage = checklistStageForWorkflow(stage);
  for (const [itemKey, label] of ITEM_TEMPLATES) {
    await db.query(
      `INSERT INTO report_verification_checklists
        (id, report_id, stage, item_key, label, required, completed)
       VALUES ($1,$2,$3,$4,$5,TRUE,FALSE)
       ON CONFLICT (report_id, stage, item_key) DO NOTHING`,
      [`vchk-${crypto.randomUUID()}`, reportId, normalizedStage, itemKey, label]
    );
  }
  return normalizedStage;
}

async function getChecklist(reportId, stage) {
  const normalizedStage = await ensureChecklist(reportId, stage);
  const result = await query(
    `SELECT id, report_id, stage, item_key, label, required, completed, comment,
            completed_by, completed_at, updated_at
       FROM report_verification_checklists
      WHERE report_id=$1 AND stage=$2
      ORDER BY item_key`,
    [reportId, normalizedStage]
  );
  const required = result.rows.filter((r) => r.required);
  return {
    reportId,
    stage: normalizedStage,
    verifierRole: expectedVerifierRole(stage),
    complete: required.length > 0 && required.every((r) => r.completed),
    items: result.rows.map(mapItem),
  };
}

async function updateChecklist(reportId, stage, items, actor) {
  if (!Array.isArray(items)) throw Object.assign(new Error("items must be an array"), { statusCode: 400 });
  const normalizedStage = await ensureChecklist(reportId, stage);
  const allowedKeys = new Set(ITEM_TEMPLATES.map(([key]) => key));
  for (const item of items) {
    if (!allowedKeys.has(item?.itemKey)) throw Object.assign(new Error(`Unknown checklist item: ${item?.itemKey}`), { statusCode: 400 });
    await query(
      `UPDATE report_verification_checklists
          SET completed=$1, comment=$2, completed_by=$3,
              completed_at=CASE WHEN $1 THEN NOW() ELSE NULL END,
              updated_at=NOW()
        WHERE report_id=$4 AND stage=$5 AND item_key=$6`,
      [Boolean(item.completed), item.comment || null, actor.id, reportId, normalizedStage, item.itemKey]
    );
  }
  return getChecklist(reportId, normalizedStage);
}

async function assertChecklistComplete(reportId, stage) {
  const checklist = await getChecklist(reportId, stage);
  if (!checklist.complete) {
    const pending = checklist.items.filter((item) => item.required && !item.completed).map((item) => item.itemKey);
    throw Object.assign(new Error(`Verification checklist is incomplete: ${pending.join(", ")}`), { statusCode: 409, code: "CHECKLIST_INCOMPLETE" });
  }
  return checklist;
}

function mapItem(row) {
  return {
    id: row.id,
    itemKey: row.item_key,
    label: row.label,
    required: row.required,
    completed: row.completed,
    comment: row.comment,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { ITEM_TEMPLATES, checklistStageForWorkflow, ensureChecklist, getChecklist, updateChecklist, assertChecklistComplete };
