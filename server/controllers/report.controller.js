/**
 * ==========================================================
 * Report Controller
 * ==========================================================
 *
 * Handles all HTTP requests for Scout Reports.
 *
 * Routes
 * ------
 * GET    /api/reports
 * GET    /api/reports/:id
 * POST   /api/reports
 * PUT    /api/reports/:id
 * DELETE /api/reports/:id
 * POST   /api/reports/:id/pests
 * POST   /api/reports/:id/diseases
 *
 * Business logic belongs in the model.
 * The controller only:
 *   - receives the request
 *   - validates basic input
 *   - calls the model
 *   - returns a response
 *
 * ==========================================================
 */

const reportModel = require("../models/report.model");

/**
 * ----------------------------------------------------------
 * GET /api/reports
 * ----------------------------------------------------------
 */
async function getReports(req, res, next) {

    try {

        const reports = await reportModel.getReports();

        res.json({

            success: true,

            count: reports.length,

            data: reports

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * GET /api/reports/:id
 * ----------------------------------------------------------
 */
async function getReport(req, res, next) {

    try {

        const report = await reportModel.getReportById(
            req.params.id
        );

        if (!report) {

            return res.status(404).json({

                success: false,

                error: "Report not found"

            });

        }

        res.json({

            success: true,

            data: report

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * POST /api/reports
 * ----------------------------------------------------------
 */
async function createReport(req, res, next) {

    try {

        const report =
            await reportModel.createReport(req.body);

        res.status(201).json({

            success: true,

            message: "Scout report created successfully.",

            data: report

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * PUT /api/reports/:id
 * ----------------------------------------------------------
 */
async function updateReport(req, res, next) {

    try {

        const report =
            await reportModel.updateReport(
                req.params.id,
                req.body
            );

        if (!report) {

            return res.status(404).json({

                success: false,

                error: "Report not found"

            });

        }

        res.json({

            success: true,

            message: "Report updated successfully.",

            data: report

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * DELETE /api/reports/:id
 * ----------------------------------------------------------
 */
async function deleteReport(req, res, next) {

    try {

        const deleted =
            await reportModel.deleteReport(
                req.params.id
            );

        if (!deleted) {

            return res.status(404).json({

                success: false,

                error: "Report not found"

            });

        }

        res.json({

            success: true,

            message: "Report deleted successfully."

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * POST /api/reports/:id/pests
 * ----------------------------------------------------------
 */
async function addPestObservation(req, res, next) {

    try {

        const observation =
            await reportModel.addPestObservation(

                req.params.id,

                req.body

            );

        res.status(201).json({

            success: true,

            message: "Pest observation added.",

            data: observation

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * POST /api/reports/:id/diseases
 * ----------------------------------------------------------
 */
async function addDiseaseObservation(req, res, next) {

    try {

        const observation =
            await reportModel.addDiseaseObservation(

                req.params.id,

                req.body

            );

        res.status(201).json({

            success: true,

            message: "Disease observation added.",

            data: observation

        });

    }
    catch (error) {

        next(error);

    }

}

module.exports = {

    getReports,

    getReport,

    createReport,

    updateReport,

    deleteReport,

    addPestObservation,

    addDiseaseObservation

};