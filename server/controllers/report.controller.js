const reportService = require("../services/report.service");

async function list(req, res, next) {
    try {
        res.json(await reportService.getReports());
    } catch (err) {
        next(err);
    }
}

async function get(req, res, next) {
    try {
        const report = await reportService.getReportById(req.params.id);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const report = await reportService.createReport(req.body);
        res.status(201).json(report);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const report = await reportService.updateReport(
            req.params.id,
            req.body
        );

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ok = await reportService.deleteReport(req.params.id);

        if (!ok) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(204).end();
    } catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const deleted = await reportService.deleteReport(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(204).end();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    get,
    create,
    update,
    remove
};