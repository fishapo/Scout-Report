"use strict";

const express = require("express");
const auth = require("../../auth");
const controller = require("../../controllers/admin/users.controller");

const router = express.Router();
router.use(auth.authenticate, auth.authorizeRoles("admin"));
router.get("/", controller.listUsers);
router.post("/", controller.createUser);
router.patch("/:id/role", controller.updateRole);
router.patch("/:id/password", controller.setPassword);
router.delete("/:id", controller.deleteUser);

module.exports = router;
