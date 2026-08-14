"use strict";

const workflow = require("../workflow.store");

async function getInbox(req, res, next) {
  try { res.json({ success: true, items: await workflow.getInbox(req.user) }); }
  catch (error) { next(error); }
}

async function getWorkflow(req, res, next) {
  try {
    const result = await workflow.getWorkflow(req.params.id, req.user);
    if (!result) return res.status(404).json({ success: false, error: "Report workflow not found" });
    res.json({ success: true, workflow: result });
  } catch (error) { next(error); }
}

async function recipients(req, res, next) {
  try { res.json({ success: true, recipients: await workflow.listRecipients(req.params.role, req.user) }); }
  catch (error) { next(error); }
}

async function share(req, res, next) {
  try {
    const result = await workflow.shareReport(req.params.id, req.user, req.body?.recipientUserId, req.body?.comment);
    res.status(200).json({ success: true, workflow: result });
  } catch (error) { next(error); }
}

async function verify(req, res, next) {
  try {
    const result = await workflow.verifyReport(req.params.id, req.user, req.body?.decision, req.body?.comment);
    res.status(200).json({ success: true, workflow: result });
  } catch (error) { next(error); }
}

module.exports = { getInbox, getWorkflow, recipients, share, verify };
