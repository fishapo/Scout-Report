"use strict";

const workflow = require("../workflow.store");

async function get(req, res, next) {
  try {
    const checklist = await workflow.reviewChecklist(req.params.id, req.user);
    res.json({ success: true, checklist });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    if (!Array.isArray(req.body?.items)) {
      return res.status(400).json({ success: false, error: "items must be an array" });
    }
    const checklist = await workflow.reviewChecklist(req.params.id, req.user, req.body.items);
    res.json({ success: true, checklist });
  } catch (error) { next(error); }
}

module.exports = { get, update };
