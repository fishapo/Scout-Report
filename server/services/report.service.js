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

module.exports = {
    getReports,
    createReport
};