/**
 * ==========================================================
 * Scout Report Routes
 * ==========================================================
 *
 * All Scout Report endpoints are defined here. Paths and
 * auth requirements match the table in README.md.
 *
 * Base Route
 * ----------
 * /scout-reports
 *
 * Endpoints
 * ---------
 * GET    /scout-reports                          - auth required
 * GET    /scout-reports/stats                     - admin only
 * GET    /scout-reports/:id                       - auth required
 * POST   /scout-reports                           - admin or scout
 * PATCH  /scout-reports/:id                       - admin only
 * POST   /scout-reports/:id/pest-observations      - admin or scout
 * POST   /scout-reports/:id/disease-observations   - admin or scout
 * DELETE /scout-reports/:id                       - admin only
 *
 * NOTE: /scout-reports/stats must be registered before
 * /scout-reports/:id, otherwise Express would match "stats"
 * as an :id value.
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

const reportController = require("../controllers/report.controller");
const auth = require("../auth");

router.get(
    "/scout-reports/stats",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.getStats
);

router.get(
    "/scout-reports",
    auth.authenticate,
    reportController.getReports
);

router.get(
    "/scout-reports/:id",
    auth.authenticate,
    reportController.getReport
);

router.post(
    "/scout-reports",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout"),
    reportController.createReport
);

router.patch(
    "/scout-reports/:id",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.updateReport
);

router.post(
    "/scout-reports/:id/pest-observations",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout"),
    reportController.addPestObservation
);

router.post(
    "/scout-reports/:id/disease-observations",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout"),
    reportController.addDiseaseObservation
);

router.delete(
    "/scout-reports/:id",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.deleteReport
);

module.exports = router;
