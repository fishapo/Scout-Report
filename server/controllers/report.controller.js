/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Report Controller
 *
 * Responsibilities
 * ----------------
 * • Handle HTTP requests for /scout-reports
 * • Call server/store.js (the PostgreSQL-backed store)
 * • Return response shapes that match previews/admin-
 *   dashboard.html and previews/user-form.html, which expect
 *   raw arrays/objects, not an { success, data } envelope.
 *
 * NOTE: this replaces the previous version of this file,
 * which called server/models/report.model.js. That model was
 * an in-memory array (see its own file header: "Phase 1 -
 * Temporary in-memory data store, no database required") and
 * did not persist data, support filtering/pagination, or
 * expose stats, despite being added in a commit titled
 * "complete Phase 3 PostgreSQL reference architecture".
 * server/store.js is the complete, tested implementation
 * (see server/store.test.js, server/store.crud.test.js) and
 * is now the single source of truth for report data.
 * models/report.model.js has been removed.
 *
 * Auth / RBAC is enforced in the route definitions
 * (server/routes/report.routes.js) using auth.authenticate
 * and auth.authorizeRoles, per the table in README.md.
 *
 * Endpoints
 * ---------
 * GET    /scout-reports
 * GET    /scout-reports/stats
 * GET    /scout-reports/:id
 * POST   /scout-reports
 * PATCH  /scout-reports/:id
 * POST   /scout-reports/:id/pest-observations
 * POST   /scout-reports/:id/disease-observations
 * DELETE /scout-reports/:id
 *
 * ==========================================================
 */

"use strict";

const store = require("../store");

/**
 * ----------------------------------------------------------
 * GET /scout-reports
 * ----------------------------------------------------------
 * Supports query params: farm, status, dateFrom, dateTo,
 * limit, offset (all optional; see store.buildReportFilters
 * and store.normalizePagination).
 * ----------------------------------------------------------
 */
async function getReports(req, res, next) {
    try {
        const reports = await store.getReports(req.query);
        res.json(reports);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /scout-reports/stats
 * ----------------------------------------------------------
 * Returns: { totalReports, criticalIssues, activeFarms,
 *            responseRate }
 * Accepts the same filters as GET /scout-reports so the
 * admin dashboard can scope stats to the current filter set.
 * ----------------------------------------------------------
 */
async function getStats(req, res, next) {
    try {
        const stats = await store.getStats(req.query);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /scout-reports/:id
 * ----------------------------------------------------------
 */
async function getReport(req, res, next) {
    try {
        const report = await store.findReport(req.params.id);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports
 * ----------------------------------------------------------
 */
async function createReport(req, res, next) {
    try {
        const report = await store.saveReport(req.body);
        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * PATCH /scout-reports/:id
 * ----------------------------------------------------------
 * store.updateReport only touches fields present on the
 * updates object (weather, temperature, humidity, notes,
 * status), which is PATCH (partial update) semantics.
 * ----------------------------------------------------------
 */
async function updateReport(req, res, next) {
    try {
        const report = await store.updateReport(req.params.id, req.body);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * DELETE /scout-reports/:id
 * ----------------------------------------------------------
 */
async function deleteReport(req, res, next) {
    try {
        const deleted = await store.deleteReport(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports/:id/pest-observations
 * ----------------------------------------------------------
 */
async function addPestObservation(req, res, next) {
    try {
        const report = await store.addPestObservation(req.params.id, req.body);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports/:id/disease-observations
 * ----------------------------------------------------------
 */
async function addDiseaseObservation(req, res, next) {
    try {
        const report = await store.addDiseaseObservation(req.params.id, req.body);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    getReports,
    getStats,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    addPestObservation,
    addDiseaseObservation
};
