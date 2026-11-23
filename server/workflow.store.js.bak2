"use strict";

const crypto = require("crypto");
const { query, transaction } = require("./db");
const checklist = require("./verification-checklist");
const {
  ROLES,
  STAGES,
  canShare,
  nextStageAfterShare,
  verifyTransition,
  expectedVerifierRole,
  expectedRecipientRole,
  roleLabel,
} = require("./workflow");

class WorkflowError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "WorkflowError";
    this.statusCode = statusCode;
  }
}

async function getWorkflow(reportId, actor) {
  const result = await query(baseSelect() + " WHERE rw.report_id = $1", [reportId]);
  if (!result.rowCount) return null;
  const workflow = mapWorkflow(result.rows[0]);
  assertCanView(workflow, actor);
  return withHistory(workflow);
}

async function getInbox(actor) {
  if (!actor?.role) throw new WorkflowError("Authentication required", 401);

  const result = await query(
    `
      SELECT
        rw.report_id,
        rw.stage,
        rw.current_holder_user_id,
        rw.updated_at,
        sr.farm_name,
        sr.crop_type,
        sr.variety,
        sr.report_date,
        sr.status,
        sr.owner_id,
        owner.name AS owner_name
      FROM report_workflows rw
      JOIN scout_reports sr ON sr.id = rw.report_id
      LEFT JOIN users owner ON owner.id = sr.owner_id
      WHERE ($1 = 'admin' AND rw.stage = 'awaiting_admin')
         OR ($1 = 'inter_farm_supervisor' AND rw.current_holder_user_id = $2 AND rw.stage IN ('awaiting_supervisor','supervisor_verified','returned_to_supervisor'))
         OR ($1 = 'head_of_department' AND rw.current_holder_user_id = $2 AND rw.stage IN ('awaiting_hod','hod_verified','returned_to_hod'))
         OR ($1 = 'scout' AND sr.owner_id = $2 AND rw.stage IN ('draft','returned_to_scout'))
      ORDER BY rw.updated_at DESC, rw.report_id DESC
    `,
    [actor.role, actor.id]
  );

  return result.rows.map((row) => ({
    reportId: row.report_id,
    stage: row.stage,
    currentHolderUserId: row.current_holder_user_id,
    updatedAt: row.updated_at,
    farmName: row.farm_name,
    cropType: row.crop_type,
    variety: row.variety,
    reportDate: row.report_date,
    reportStatus: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
  }));
}

async function listRecipients(role, actor) {
  const allowed = expectedRecipientRoleForActor(actor?.role);
  if (!allowed || allowed !== role) {
    throw new WorkflowError("That recipient role is not valid for your workflow stage", 403);
  }

  const result = await query(
    `SELECT id, name, email, role FROM users WHERE role = $1 AND is_active = true ORDER BY name, email`,
    [role]
  );
  return result.rows;
}

async function shareReport(reportId, actor, recipientUserId, comment = "") {
  if (!recipientUserId) throw new WorkflowError("Recipient user is required");

  return transaction(async (client) => {
    const workflow = await getWorkflowForClient(client, reportId);
    assertCanAct(workflow, actor);

    const recipientResult = await client.query(
      `SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
      [recipientUserId]
    );
    if (!recipientResult.rowCount) throw new WorkflowError("Recipient user not found", 404);

    const recipient = recipientResult.rows[0];
    const expectedRole = expectedRecipientRole(workflow.stage, actor.role);
    if (!canShare(workflow.stage, actor.role, recipient.role) || recipient.role !== expectedRole) {
      throw new WorkflowError(`Report cannot be shared from ${workflow.stage} by ${roleLabel(actor.role)}`, 409);
    }

    const nextStage = nextStageAfterShare(workflow.stage, actor.role);
    await client.query(
      `UPDATE report_workflows SET stage = $1, current_holder_user_id = $2, updated_at = NOW() WHERE report_id = $3`,
      [nextStage, recipient.id, reportId]
    );

    await insertEvent(client, {
      reportId,
      actor,
      action: "share",
      fromStage: workflow.stage,
      toStage: nextStage,
      recipientUserId: recipient.id,
      comment,
    });

    return getWorkflowForClient(client, reportId, true);
  });
}

async function verifyReport(reportId, actor, decision, comment = "") {
  const normalizedDecision = String(decision || "").trim().toLowerCase();
  if (!['approve', 'reject'].includes(normalizedDecision)) {
    throw new WorkflowError("Verification decision must be approve or reject");
  }

  return transaction(async (client) => {
    const workflow = await getWorkflowForClient(client, reportId);
    assertCanAct(workflow, actor);

    const expectedRole = expectedVerifierRole(workflow.stage);
    if (expectedRole !== actor.role) {
      throw new WorkflowError(`This report is not awaiting verification by ${roleLabel(actor.role)}`, 409);
    }

    const nextStage = verifyTransition(workflow.stage, actor.role, normalizedDecision);
    if (!nextStage) throw new WorkflowError("Invalid verification transition", 409);
    if (normalizedDecision === "approve") {
      const check = await checklist.getChecklist(reportId, workflow.stage);
      if (!check.complete) {
        const pending = check.items.filter((item) => item.required && !item.completed).map((item) => item.itemKey);
        throw new WorkflowError(`Verification checklist is incomplete: ${pending.join(", ")}`, 409);
      }
    }

    let nextHolderUserId = actor.id;
    if (normalizedDecision === "reject") {
      const previous = await client.query(
        `SELECT actor_user_id FROM report_workflow_events WHERE report_id = $1 AND action = 'share' ORDER BY created_at DESC, id DESC LIMIT 1`,
        [reportId]
      );
      nextHolderUserId = previous.rows[0]?.actor_user_id || workflow.ownerId;
      if (!nextHolderUserId) {
        throw new WorkflowError("Cannot return report because the previous owner is unavailable", 409);
      }
    }

    await client.query(
      `UPDATE report_workflows SET stage = $1, current_holder_user_id = $2, updated_at = NOW() WHERE report_id = $3`,
      [nextStage, nextHolderUserId, reportId]
    );

    await insertEvent(client, {
      reportId,
      actor,
      action: normalizedDecision === 'approve' ? 'verify' : 'return',
      fromStage: workflow.stage,
      toStage: nextStage,
      recipientUserId: normalizedDecision === 'approve' ? actor.id : null,
      comment,
    });

    return getWorkflowForClient(client, reportId, true);
  });
}

async function getWorkflowForClient(client, reportId, includeHistory = true) {
  const result = await client.query(baseSelect() + " WHERE rw.report_id = $1", [reportId]);
  if (!result.rowCount) throw new WorkflowError("Report workflow not found", 404);
  const workflow = mapWorkflow(result.rows[0]);
  if (!includeHistory) return workflow;
  const history = await client.query(
    `
      SELECT e.id, e.action, e.from_stage, e.to_stage, e.comment, e.created_at,
             e.actor_user_id, e.actor_role, e.recipient_user_id,
             actor.name AS actor_name, recipient.name AS recipient_name
      FROM report_workflow_events e
      LEFT JOIN users actor ON actor.id = e.actor_user_id
      LEFT JOIN users recipient ON recipient.id = e.recipient_user_id
      WHERE e.report_id = $1
      ORDER BY e.created_at ASC, e.id ASC
    `,
    [reportId]
  );
  workflow.history = history.rows.map(mapEvent);
  return workflow;
}

async function withHistory(workflow) {
  const result = await query(
    `
      SELECT e.id, e.action, e.from_stage, e.to_stage, e.comment, e.created_at,
             e.actor_user_id, e.actor_role, e.recipient_user_id,
             actor.name AS actor_name, recipient.name AS recipient_name
      FROM report_workflow_events e
      LEFT JOIN users actor ON actor.id = e.actor_user_id
      LEFT JOIN users recipient ON recipient.id = e.recipient_user_id
      WHERE e.report_id = $1
      ORDER BY e.created_at ASC, e.id ASC
    `,
    [workflow.reportId]
  );
  workflow.history = result.rows.map(mapEvent);
  return workflow;
}

function assertCanView(workflow, actor) {
  if (!actor) throw new WorkflowError("Authentication required", 401);
  if (actor.role === ROLES.ADMIN) return;
  if (actor.role === ROLES.SCOUT && workflow.ownerId === actor.id) return;
  if (workflow.currentHolderUserId === actor.id && workflow.currentHolderRole === actor.role) return;
  throw new WorkflowError("You do not have access to this report workflow", 403);
}

function assertCanAct(workflow, actor) {
  assertCanView(workflow, actor);
  if (actor.role === ROLES.ADMIN && workflow.stage === STAGES.AWAITING_ADMIN) return;
  if (workflow.currentHolderUserId !== actor.id) {
    throw new WorkflowError("The report is not currently assigned to you", 409);
  }
}

function expectedRecipientRoleForActor(role) {
  if (role === ROLES.SCOUT) return ROLES.INTER_FARM_SUPERVISOR;
  if (role === ROLES.INTER_FARM_SUPERVISOR) return ROLES.HEAD_OF_DEPARTMENT;
  if (role === ROLES.HEAD_OF_DEPARTMENT) return ROLES.ADMIN;
  return null;
}

function baseSelect() {
  return `
    SELECT
      rw.report_id,
      rw.stage,
      rw.current_holder_user_id,
      rw.updated_at,
      sr.owner_id,
      holder.name AS current_holder_name,
      holder.role AS current_holder_role,
      sr.farm_name,
      sr.crop_type,
      sr.variety,
      sr.report_date,
      sr.status AS report_status
    FROM report_workflows rw
    JOIN scout_reports sr ON sr.id = rw.report_id
    LEFT JOIN users holder ON holder.id = rw.current_holder_user_id
  `;
}

function mapWorkflow(row) {
  return {
    reportId: row.report_id,
    stage: row.stage,
    currentHolderUserId: row.current_holder_user_id,
    currentHolderName: row.current_holder_name,
    currentHolderRole: row.current_holder_role,
    ownerId: row.owner_id,
    farmName: row.farm_name,
    cropType: row.crop_type,
    variety: row.variety,
    reportDate: row.report_date,
    reportStatus: row.report_status,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row) {
  return {
    id: row.id,
    action: row.action,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    comment: row.comment,
    createdAt: row.created_at,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    actorName: row.actor_name,
    recipientUserId: row.recipient_user_id,
    recipientName: row.recipient_name,
  };
}

async function insertEvent(client, event) {
  await client.query(
    `
      INSERT INTO report_workflow_events
        (id, report_id, actor_user_id, actor_role, action, from_stage, to_stage, recipient_user_id, comment, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    `,
    [
      crypto.randomUUID(),
      event.reportId,
      event.actor.id,
      event.actor.role,
      event.action,
      event.fromStage,
      event.toStage,
      event.recipientUserId || null,
      String(event.comment || '').trim() || null,
    ]
  );
}

module.exports = {
  WorkflowError,
  getWorkflow,
  getInbox,
  listRecipients,
  shareReport,
  verifyReport,
};
