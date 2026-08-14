"use strict";
const { query } = require("../db");
const workflow = require("../workflow.store");

const VISIT_FIELDS = Object.freeze({
  organisationId: "organisation_id",
  growerName: "grower_name",
  scoutName: "scout_name",
  fieldName: "field_name",
  fieldArea: "field_area",
  fieldAreaUnit: "field_area_unit",
  growthStage: "growth_stage",
  plantingDate: "planting_date",
  expectedHarvestDate: "expected_harvest_date",
  visitPurpose: "visit_purpose",
  scoutingPattern: "scouting_pattern",
  visitStartedAt: "visit_started_at",
  visitEndedAt: "visit_ended_at",
});

async function patchVisit(req,res,next){
  try {
    const wf = await workflow.getWorkflow(req.params.id, req.user);
    if (!wf) return res.status(404).json({success:false,error:"Report workflow not found"});
    if (req.user.role !== "admin" && wf.ownerId !== req.user.id && wf.currentHolderUserId !== req.user.id) {
      return res.status(403).json({success:false,error:"You do not have permission to edit visit data"});
    }
    const fields=[]; const values=[];
    for (const [input,column] of Object.entries(VISIT_FIELDS)) {
      if (!(input in (req.body||{}))) continue;
      values.push(req.body[input] === "" ? null : req.body[input]);
      fields.push(`${column}=$${values.length}`);
    }
    if (!fields.length) return res.status(400).json({success:false,error:"At least one visit field is required"});
    values.push(new Date(), req.params.id);
    const result=await query(`UPDATE scout_reports SET ${fields.join(",")}, updated_at=$${values.length-1} WHERE id=$${values.length} RETURNING *`,values);
    if(!result.rowCount) return res.status(404).json({success:false,error:"Report not found"});
    res.json({success:true,report:result.rows[0]});
  } catch(e){next(e);}
}
module.exports={patchVisit};
