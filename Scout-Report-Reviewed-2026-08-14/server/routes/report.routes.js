"use strict";


const express = require("express");

const router = express.Router();


const reportController =
    require("../controllers/report.controller");
const reportExtensionController = require("../controllers/report-extension.controller");


const auth =
    require("../auth");



// ==========================================================
// GET /api/reports/stats
// Admin only
// ==========================================================

router.get(
    "/stats",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.getStats
);



// ==========================================================
// GET /api/reports
// ==========================================================

router.get(
    "/",
    auth.authenticate,
    reportController.getReports
);



router.patch(
    "/:id/visit",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department"),
    reportExtensionController.patchVisit
);


// ==========================================================
// GET /api/reports/:id
// ==========================================================

router.get(
    "/export-canonical.xlsx",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department"),
    reportController.exportCanonicalExcel
);

router.post(
    "/import-canonical.xlsx",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department"),
    reportController.importCanonicalExcel
);

router.get(
    "/export.xlsx",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department"),
    reportController.exportExcel
);

router.post(
    "/import.xlsx",
    auth.authenticate,
    auth.authorizeRoles("admin", "scout", "inter_farm_supervisor", "head_of_department"),
    reportController.importExcel
);

router.get(
    "/:id",
    auth.authenticate,
    reportController.getReport
);



// ==========================================================
// POST /api/reports
// ==========================================================

router.post(
    "/",
    auth.authenticate,
    auth.authorizeRoles(
        "admin",
        "scout",
        "inter_farm_supervisor",
        "head_of_department"
    ),
    reportController.createReport
);



// ==========================================================
// PATCH /api/reports/:id
// ==========================================================

router.patch(
    "/:id",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.updateReport
);



// ==========================================================
// POST /api/reports/:id/pest-observations
// ==========================================================

router.post(
    "/:id/pest-observations",
    auth.authenticate,
    auth.authorizeRoles(
        "admin",
        "scout",
        "inter_farm_supervisor",
        "head_of_department"
    ),
    reportController.addPestObservation
);



// ==========================================================
// POST /api/reports/:id/disease-observations
// ==========================================================

router.post(
    "/:id/disease-observations",
    auth.authenticate,
    auth.authorizeRoles(
        "admin",
        "scout",
        "inter_farm_supervisor",
        "head_of_department"
    ),
    reportController.addDiseaseObservation
);



// ==========================================================
// DELETE /api/reports/:id
// ==========================================================

router.delete(
    "/:id",
    auth.authenticate,
    auth.authorizeRoles("admin"),
    reportController.deleteReport
);



module.exports = router;
