"use strict";

const express = require("express");
const auth = require("../auth");
const controller = require("../controllers/workflow.controller");

const router = express.Router();
const workflowRoles = auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department");

router.get("/inbox", auth.authenticate, workflowRoles, controller.getInbox);
router.get("/recipients/:role", auth.authenticate, workflowRoles, controller.recipients);
router.get("/:id", auth.authenticate, workflowRoles, controller.getWorkflow);
router.post("/:id/share", auth.authenticate, workflowRoles, controller.share);
router.post("/:id/verify", auth.authenticate, workflowRoles, controller.verify);

module.exports = router;
