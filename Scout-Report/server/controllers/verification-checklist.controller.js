"use strict";
const checklist = require("../verification-checklist");
const workflow = require("../workflow.store");
async function get(req,res,next){try{const wf=await workflow.getWorkflow(req.params.id,req.user); if(!wf) return res.status(404).json({success:false,error:"Report workflow not found"}); res.json({success:true,checklist:await checklist.getChecklist(req.params.id,wf.stage)});}catch(e){next(e);}}
async function update(req,res,next){try{const wf=await workflow.getWorkflow(req.params.id,req.user); if(!wf) return res.status(404).json({success:false,error:"Report workflow not found"}); if(req.user.role!=="admin" && wf.currentHolderUserId!==req.user.id){const e=new Error("Checklist can only be updated by the current verifier");e.statusCode=403;throw e;} res.json({success:true,checklist:await checklist.updateChecklist(req.params.id,wf.stage,req.body?.items,req.user)});}catch(e){next(e);}}
module.exports={get,update};
