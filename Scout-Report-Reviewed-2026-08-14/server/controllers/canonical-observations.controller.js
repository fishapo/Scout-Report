"use strict";
const observations = require("../canonical-observations");
const workflow = require("../workflow.store");

async function assertEditable(reportId, actor) {
  const wf = await workflow.getWorkflow(reportId, actor);
  if (!wf) { const e = new Error("Report workflow not found"); e.statusCode = 404; throw e; }
  if (actor.role === "admin" || wf.ownerId === actor.id || wf.currentHolderUserId === actor.id) return;
  const e = new Error("You do not have permission to modify this report"); e.statusCode = 403; throw e;
}

async function create(req,res,next) {
  try { await assertEditable(req.params.id, req.user); res.status(201).json({ success:true, observation: await observations.insertObservation(req.params.domain, req.params.id, req.body, req.user) }); }
  catch(e){ next(e); }
}
async function list(req,res,next) {
  try { await workflow.getWorkflow(req.params.id, req.user); res.json({ success:true, observations: await observations.listObservations(req.params.domain, req.params.id) }); }
  catch(e){ next(e); }
}
async function full(req,res,next) {
  try { const report = await observations.fullReport(req.params.id, req.user); if(!report) return res.status(404).json({success:false,error:"Report not found"}); res.json({success:true,report}); }
  catch(e){ next(e); }
}
module.exports = { create, list, full };
