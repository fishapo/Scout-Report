const reportService = require("../services/report.service");

async function list(req, res, next) {
    try {
        res.json(await reportService.getReports());
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

module.exports = {
    list,
    create
};