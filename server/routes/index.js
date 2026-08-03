/**
 * ==========================================================
 * Scout Report API
 * server/routes/index.js
 * ==========================================================
 *
 * Central API Route Registration
 *
 * API Version: 2.0.0
 *
 * Base Mount:
 * app.use(routes)
 *
 * Final Routes:
 *
 * GET  /api
 *
 * Health:
 * GET  /api/health
 *
 * Authentication:
 * GET  /api/auth/*
 *
 * Reference:
 * GET  /api/reference
 * GET  /api/reference/farms
 * GET  /api/reference/crop-types
 * GET  /api/reference/crop-types/:id/varieties
 * GET  /api/reference/pests
 * GET  /api/reference/diseases
 *
 * Reports:
 * GET  /api/reports/*
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Route Imports
|--------------------------------------------------------------------------
*/

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const referenceRoutes = require("./reference.routes");
const reportRoutes = require("./report.routes");


/*
|--------------------------------------------------------------------------
| API Root
|--------------------------------------------------------------------------
*/

router.get("/api", (req, res) => {

    res.json({

        success: true,

        application: "Scout Report API",

        version: "2.0.0",

        status: "Running",

        environment: process.env.NODE_ENV || "development"

    });

});


/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

router.use(
    "/api/health",
    healthRoutes
);


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(
    "/api/auth",
    authRoutes
);


/*
|--------------------------------------------------------------------------
| Reference Data
|--------------------------------------------------------------------------
*/

router.use(
    "/api/reference",
    referenceRoutes
);


/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

router.use(
    "/api/reports",
    reportRoutes
);


module.exports = router;