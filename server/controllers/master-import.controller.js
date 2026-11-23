"use strict";
const { stageWorkbook, listBatches, getBatch, exportSourceWorkbook, commitBatch, getAssignedPrefill } = require("../import/master-import.service");
const { acquireWorkbookImport } = require("../import/workbook-import-guard");

async function stageMasterWorkbook(req,res,next){
  const releaseImport = acquireWorkbookImport();
  if (!releaseImport) return res.status(429).json({ success: false, error: "Workbook import capacity is busy. Try again shortly." });
  try {
    const b64=typeof req.body?.workbookBase64==="string"?req.body.workbookBase64:"";
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(b64.replace(/^data:.*?;base64,/, ""), "base64");
    if (!buffer.length) return res.status(400).json({ success: false, error: "Select a non-empty .xlsx workbook" });
    const sourceName = req.query.sourceName || req.body?.sourceName || "Combined Scout Report Master.xlsx";
    if (typeof sourceName !== "string" || sourceName.length > 255) {
      return res.status(400).json({ success: false, error: "Invalid workbook file name" });
    }
    const result = await stageWorkbook(buffer, sourceName, req.user);
    res.status(201).json({success:true,...result,commitRequired:true,message:"Workbook staged and validated. No production reports were created."});
  }catch(e){next(e)}finally{releaseImport()}
}

async function commitMasterWorkbook(req,res,next){
  try { res.status(200).json({success:true,...await commitBatch(req.params.id,req.user)}); }
  catch(e){next(e)}
}

async function exportMasterSource(req,res,next){
  try {
    const workbook = await exportSourceWorkbook(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="import-${req.params.id}-source.xlsx"`);
    res.send(workbook);
  } catch(e){ next(e); }
}

async function getMasterImportBatch(req,res,next){try{const batch=await getBatch(req.params.id);if(!batch)return res.status(404).json({success:false,error:"Import batch not found"});res.json({success:true,batch})}catch(e){next(e)}}
async function listMasterImportBatches(req, res, next) {
  try { res.json({ success: true, batches: await listBatches() }); }
  catch (error) { next(error); }
}

async function getScoutWorkbookPrefill(req, res, next) {
  try {
    res.json({ success: true, prefill: await getAssignedPrefill(req.user.id) });
  } catch (error) { next(error); }
}

module.exports={stageMasterWorkbook,getScoutWorkbookPrefill,listMasterImportBatches,commitMasterWorkbook,exportMasterSource,getMasterImportBatch};
