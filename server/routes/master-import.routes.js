"use strict";const express=require("express");const router=express.Router();const auth=require("../auth");const controller=require("../controllers/master-import.controller");const roles=auth.authorizeRoles("admin","head_of_department");router.post("/stage",auth.authenticate,roles,controller.stageMasterWorkbook);router.post("/:id/commit",auth.authenticate,roles,controller.commitMasterWorkbook);
router.get("/:id/source.xlsx",auth.authenticate,roles,controller.exportMasterSource);
router.get("/:id",auth.authenticate,roles,controller.getMasterImportBatch);module.exports=router;
