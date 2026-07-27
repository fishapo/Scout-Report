/**
 * ==========================================================
 * Scout Report API
 * server/routes/index.js
 * ==========================================================
 *
 * Central Route Registration
 *
 * All application routes are mounted here.
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

router.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| Reference Data
|--------------------------------------------------------------------------
*/

router.use("/api/reference", referenceRoutes);

/*
|--------------------------------------------------------------------------
| Scout Reports
|--------------------------------------------------------------------------
*/

router.use("/api/reports", reportRoutes);

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