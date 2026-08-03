/**
 * ==========================================================
 * Scout Report API
 * server/routes/index.js
 * ==========================================================
 *
 * Central Route Registration
 *
 * Path convention: this matches README.md and the existing
 * preview frontend (previews/user-form.html, previews/admin-
 * dashboard.html), which call unprefixed paths like /farms
 * and /scout-reports directly - not /api/farms. Only the
 * health check keeps its /api prefix, matching the existing
 * .github/workflows/azure-webapps-node.yml smoke test that
 * calls /api/health.
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const authRoutes = require("./auth.routes");
const reportRoutes = require("./report.routes");
const referenceRoutes = require("./reference.routes");
const healthRoutes = require("./health.routes");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

router.use("/api/health", healthRoutes);

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use("/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| Reference Data (farms, crop-types, pests, diseases)
|--------------------------------------------------------------------------
*/

router.use("/", referenceRoutes);

/*
|--------------------------------------------------------------------------
| Scout Reports
|--------------------------------------------------------------------------
*/

router.use("/", reportRoutes);

/*
|--------------------------------------------------------------------------
| Root Endpoint
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {

    res.json({

        success: true,

        application: "Scout Report API",

        version: "2.0.0",

        status: "Running"

    });

});

/*
|--------------------------------------------------------------------------
| Export Router
|--------------------------------------------------------------------------
*/

module.exports = router;
