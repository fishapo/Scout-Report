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
            report_date
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
            id,
            data.farm_id,
            data.farm_name,
            data.crop_type,
            data.variety,
            data.report_date
        ]
    );

    return result.rows[0];
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
async function updateReport(id, data) {
    const result = await query(
        `
        UPDATE scout_reports
        SET
            farm_name = $2,
            crop_type = $3,
            variety = $4,
            report_date = $5,
            weather = $6,
            temperature = $7,
            humidity = $8,
            notes = $9,
            status = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [
            id,
            data.farm_name,
            data.crop_type,
            data.variety,
            data.report_date,
            data.weather,
            data.temperature,
            data.humidity,
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
    createReport,
    getReportById,
    updateReport,
    deleteReport
    
};

