"use strict";

const express = require("express");
const auth = require("../auth");
const { snapshot } = require("../metrics");

const router = express.Router();

router.get("/", auth.authenticate, auth.authorizeRoles("admin"), (_req, res) => {
  res.json({ success: true, metrics: snapshot() });
});

module.exports = router;
