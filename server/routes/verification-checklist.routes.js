"use strict";
const express=require("express");
const auth=require("../auth");
const controller=require("../controllers/verification-checklist.controller");
const router=express.Router();
const roles=auth.authorizeRoles("admin","scout","inter_farm_supervisor","head_of_department");
router.get("/:id/checklist",auth.authenticate,roles,controller.get);
router.put("/:id/checklist",auth.authenticate,roles,controller.update);
module.exports=router;
