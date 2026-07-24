const { query } = require("../db");
const crypto = require("crypto");

async function getReports() {
    const result = await query(`
        SELECT *
        FROM scout_reports
        ORDER BY created_at DESC
    `);

    return result.rows;
}

async function getReportById(id) {
    const result = await query(
        `
        SELECT *
        FROM scout_reports
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0] || null;
}

async function createReport(data) {

    const id = crypto.randomUUID();

    const result = await query(
        `
        INSERT INTO scout_reports
        (
            id,
            farm_id,
            farm_name,
            crop_type,
            variety,
            is_greenhouse,
            report_date,
            implementation_week,
            implementation_year,
            weather,
            temperature,
            humidity,
            location,
            notes,
            status
        )
        VALUES
        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10,
            $11,$12,$13,$14,$15
        )
        RETURNING *
        `,
        [
            id,
            data.farm_id,
            data.farm_name,
            data.crop_type,
            data.variety,
            data.is_greenhouse,
            data.report_date,
            data.implementation_wafeek,
            data.implementation_year,
            data.weather,
            data.temperature,
            data.humidity,
            data.location,
            data.notes,
            data.status || "Pending"
        ]
    );

    return result.rows[0];
}
async function updateReport(id, data) {
    const result = await query(
        `
        UPDATE scout_reports
        SET
            farm_name = $2,
            crop_type = $3,
            variety = $4,
            is_greenhouse = $5,
            report_date = $6,
            implementation_week = $7,
            implementation_year = $8,
            weather = $9,
            temperature = $10,
            humidity = $11,
            location = $12,
            notes = $13,
            status = $14,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [
            id,
            data.farm_name,
            data.crop_type,
            data.variety,
            data.is_greenhouse,
            data.report_date,
            data.implementation_week,
            data.implementation_year,
            data.weather,
            data.temperature,
            data.humidity,
            data.location
                ? JSON.stringify(data.location)
                : null,
            data.notes,
            data.status
        ]
    );

    return result.rows[0] || null;
}

async function deleteReport(id) {
    const result = await query(
        `
        DELETE FROM scout_reports
        WHERE id = $1
        RETURNING id
        `,
        [id]
    );

    return result.rowCount > 0;
}

module.exports = {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport
};