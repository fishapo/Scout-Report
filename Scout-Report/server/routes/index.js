/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * File:
 * server/routes/index.js
 *
 * Central API Route Registration
 *
 * Base Mount:
 * app.use("/api", routes);
 *
 * Final Endpoints
 * ----------------------------------------------------------
 *
 * GET    /api
 * GET    /api/health
 *
 * GET    /api/reference
 * GET    /api/reference/farms
 * GET    /api/reference/crop-types
 * GET    /api/reference/crop-types/:id/varieties
 * GET    /api/reference/pests
 * GET    /api/reference/diseases
 *
 * GET    /api/reports/*
 *
 * Authentication routes are NOT mounted here.
 * They are mounted directly in app.js:
 *
 * app.use("/auth", authRoutes);
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

// ==========================================================
// Route Imports
// ==========================================================

const healthRoutes = require("./health.routes");
const referenceRoutes = require("./reference.routes");
const reportRoutes = require("./report.routes");
const adminReferenceRoutes = require("./admin/reference.routes");
const metricsRoutes = require("./metrics.routes");
const workflowRoutes = require("./workflow.routes");
const adminUsersRoutes = require("./admin/users.routes");
const dashboardRoutes = require("./dashboard.routes");
const canonicalObservationRoutes = require("./canonical-observations.routes");
const verificationChecklistRoutes = require("./verification-checklist.routes");
const masterImportRoutes = require("./master-import.routes");

// ==========================================================
// API Root
// GET /api
// ==========================================================

router.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        application: "Scout Report API",

        version: "2.0.0",

        status: "Running",

        environment:
            process.env.NODE_ENV || "development"

    });

});

// ==========================================================
// Health
// GET /api/health
// ==========================================================

router.use(
    "/health",
    healthRoutes
);

// ==========================================================
// Reference Data
// GET /api/reference/*
// ==========================================================

router.use(
    "/reference",
    referenceRoutes
);

// Canonical observation API
router.use(
    "/canonical-observations",
    canonicalObservationRoutes
);

// ==========================================================
// Admin Reference Data CRUD
// GET/POST/PATCH/DELETE /api/admin/reference/*
// ==========================================================

router.use(
    "/admin/reference",
    adminReferenceRoutes
);

// Admin user/role management.
router.use(
    "/admin/users",
    adminUsersRoutes
);

// Admin-only operational metrics. Scout-facing reference contracts remain unchanged.
router.use(
    "/admin/metrics",
    metricsRoutes
);

// ==========================================================
// Shared analytics dashboard
// ==========================================================
router.use("/dashboard", dashboardRoutes);

// ==========================================================
// Report Workflow
// GET/POST /api/workflow/*
// ==========================================================

router.use(
    "/workflow",
    workflowRoutes
);

router.use("/reports/master-import", masterImportRoutes);

// ==========================================================
// Reports
// GET /api/reports/*
// ==========================================================

router.use(
    "/reports",
    reportRoutes
);

// ==========================================================
// API 404
// ==========================================================

router.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "API endpoint not found",

        method: req.method,

        path: req.originalUrl

    });

});

module.exports = router;