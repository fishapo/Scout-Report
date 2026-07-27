/**
 * ==========================================================
 * Scout Report Routes
 * ==========================================================
 *
 * All Scout Report endpoints are defined here.
 *
 * Base Route
 * ----------
 * /api/reports
 *
 * Endpoints
 * ---------
 * GET    /api/reports
 * GET    /api/reports/:id
 * POST   /api/reports
 * PUT    /api/reports/:id
 * DELETE /api/reports/:id
 * POST   /api/reports/:id/pests
 * POST   /api/reports/:id/diseases
 *
 * ==========================================================
 */

const express = require("express");

const router = express.Router();

const reportController =
    require("../controllers/report.controller");

/**
 * ----------------------------------------------------------
 * GET
 * Retrieve all scout reports
 * ----------------------------------------------------------
 */
router.get(
    "/reports",
    reportController.getReports
);

/**
 * ----------------------------------------------------------
 * GET
 * Retrieve a single report
 * ----------------------------------------------------------
 */
router.get(
    "/reports/:id",
    reportController.getReport
);

/**
 * ----------------------------------------------------------
 * POST
 * Create a new scout report
 * ----------------------------------------------------------
 */
router.post(
    "/reports",
    reportController.createReport
);

/**
 * ----------------------------------------------------------
 * PUT
 * Update an existing report
 * ----------------------------------------------------------
 */
router.put(
    "/reports/:id",
    reportController.updateReport
);

/**
 * ----------------------------------------------------------
 * DELETE
 * Remove a report
 * ----------------------------------------------------------
 */
router.delete(
    "/reports/:id",
    reportController.deleteReport
);

/**
 * ----------------------------------------------------------
 * POST
 * Add pest observation
 * ----------------------------------------------------------
 */
router.post(
    "/reports/:id/pests",
    reportController.addPestObservation
);

/**
 * ----------------------------------------------------------
 * POST
 * Add disease observation
 * ----------------------------------------------------------
 */
router.post(
    "/reports/:id/diseases",
    reportController.addDiseaseObservation
);

module.exports = router;