"use strict";
const { stageWorkbook, getBatch, exportSourceWorkbook, commitBatch } = require("../import/master-import.service");

async function stageMasterWorkbook(req,res,next){
  try {
    const b64=typeof req.body?.workbookBase64==="string"?req.body.workbookBase64:"";
    if(!b64)return res.status(400).json({success:false,error:"workbookBase64 is required"});
    const buffer=Buffer.from(b64.replace(/^data:.*?;base64,/,""),"base64");
    if(!buffer.length)return res.status(400).json({success:false,error:"Empty workbook"});
    const result=await stageWorkbook(buffer,req.body.sourceName||"Combined Scout Report Master.xlsx",req.user);
    res.status(201).json({success:true,...result,commitRequired:true,message:"Workbook staged and validated. No production reports were created."});
  }catch(e){next(e)}
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
module.exports={stageMasterWorkbook,commitMasterWorkbook,exportMasterSource,getMasterImportBatch};
