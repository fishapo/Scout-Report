/**
 * ==========================================================
 * Scout Report Model
 * ==========================================================
 *
 * Temporary in-memory data store.
 *
 * Phase 1
 * --------
 * • No database required
 * • Stores reports in memory
 * • Easy to test APIs
 *
 * Phase 2
 * --------
 * Replace every function with PostgreSQL queries.
 *
 * ==========================================================
 */

const crypto = require("crypto");

/**
 * ----------------------------------------------------------
 * Temporary Storage
 * ----------------------------------------------------------
 */

const reports = [];

/**
 * ==========================================================
 * Get All Reports
 * ==========================================================
 */

async function getReports() {

    return reports;

}

/**
 * ==========================================================
 * Get Report By ID
 * ==========================================================
 */

async function getReportById(id) {

    return reports.find(

        report => report.id === id

    );

}

/**
 * ==========================================================
 * Create Report
 * ==========================================================
 */

async function createReport(data) {

    const report = {

        id: crypto.randomUUID(),

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

        farm_id: data.farm_id,

        farm_name: data.farm_name,

        crop_type: data.crop_type,

        variety: data.variety,

        report_date: data.report_date,

        implementation_week: data.implementation_week,

        implementation_year: data.implementation_year,

        is_greenhouse: data.is_greenhouse,

        weather: data.weather,

        temperature: data.temperature,

        humidity: data.humidity,

        location: data.location,

        notes: data.notes,

        status: data.status || "Pending",

        pest_observations:
            data.pest_observations || [],

        disease_observations:
            data.disease_observations || []

    };

    reports.push(report);

    return report;

}

/**
 * ==========================================================
 * Update Report
 * ==========================================================
 */

async function updateReport(id, updates) {

    const report = reports.find(

        report => report.id === id

    );

    if (!report) {

        return null;

    }

    Object.assign(

        report,

        updates,

        {

            updated_at:

                new Date().toISOString()

        }

    );

    return report;

}

/**
 * ==========================================================
 * Delete Report
 * ==========================================================
 */

async function deleteReport(id) {

    const index = reports.findIndex(

        report => report.id === id

    );

    if (index === -1) {

        return false;

    }

    reports.splice(index, 1);

    return true;

}

/**
 * ==========================================================
 * Add Pest Observation
 * ==========================================================
 */

async function addPestObservation(

    reportId,

    observation

) {

    const report = reports.find(

        report => report.id === reportId

    );

    if (!report) {

        return null;

    }

    report.pest_observations.push({

        id: crypto.randomUUID(),

        ...observation

    });

    report.updated_at =

        new Date().toISOString();

    return report;

}

/**
 * ==========================================================
 * Add Disease Observation
 * ==========================================================
 */

async function addDiseaseObservation(

    reportId,

    observation

) {

    const report = reports.find(

        report => report.id === reportId

    );

    if (!report) {

        return null;

    }

    report.disease_observations.push({

        id: crypto.randomUUID(),

        ...observation

    });

    report.updated_at =

        new Date().toISOString();

    return report;

}

/**
 * ==========================================================
 * Exports
 * ==========================================================
 */

module.exports = {

    getReports,

    getReportById,

    createReport,

    updateReport,

    deleteReport,

    addPestObservation,

    addDiseaseObservation

};