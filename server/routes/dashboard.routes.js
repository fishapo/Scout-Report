"use strict";
const express=require("express");
const auth=require("../auth");
const controller=require("../controllers/dashboard.controller");
const router=express.Router();
router.get("/",auth.authenticate,auth.authorizeRoles("admin","scout","inter_farm_supervisor","head_of_department"),controller.getSnapshot);
module.exports=router;
