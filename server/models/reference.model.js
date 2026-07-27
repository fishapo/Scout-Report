/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Reference Model
 *
 * Responsibilities
 * ----------------
 * • Retrieve farms
 * • Retrieve crop types
 * • Retrieve crop varieties
 * • Retrieve pests
 * • Retrieve diseases
 *
 * Returns all lookup data required by the
 * Scout Report User Form.
 *
 * ==========================================================
 */

"use strict";

const { query } = require("../db");

/**
 * ----------------------------------------------------------
 * Get Farms
 * ----------------------------------------------------------
 */

async function getFarms() {

    const result = await query(`
        SELECT
            id,
            name
        FROM farms
        ORDER BY name;
    `);

    return result.rows;

}

/**
 * ----------------------------------------------------------
 * Get Crop Types
 * ----------------------------------------------------------
 */

async function getCropTypes() {

    const result = await query(`
        SELECT
            id,
            name
        FROM crop_types
        ORDER BY name;
    `);

    return result.rows;

}

/**
 * ----------------------------------------------------------
 * Get Crop Varieties
 * ----------------------------------------------------------
 *
 * Converts:
 *
 * id | crop_type_id | name
 *
 * into:
 *
 * {
 *    "CROP-001": [
 *        "Cherry Tomato",
 *        "Roma Tomato"
 *    ]
 * }
 *
 * ----------------------------------------------------------
 */

async function getVarieties() {

    const result = await query(`
        SELECT
            crop_type_id,
            name
        FROM crop_varieties
        ORDER BY crop_type_id, name;
    `);

    const grouped = {};

    for (const row of result.rows) {

        if (!grouped[row.crop_type_id]) {

            grouped[row.crop_type_id] = [];

        }

        grouped[row.crop_type_id].push(row.name);

    }

    return grouped;

}

/**
 * ----------------------------------------------------------
 * Get Pests
 * ----------------------------------------------------------
 */

async function getPests() {

    const result = await query(`
        SELECT
            name
        FROM pests
        ORDER BY name;
    `);

    return result.rows.map(row => row.name);

}

/**
 * ----------------------------------------------------------
 * Get Diseases
 * ----------------------------------------------------------
 */

async function getDiseases() {

    const result = await query(`
        SELECT
            name
        FROM diseases
        ORDER BY name;
    `);

    return result.rows.map(row => row.name);

}

/**
 * ----------------------------------------------------------
 * Get All Reference Data
 * ----------------------------------------------------------
 */

async function getReferenceData() {

    const [

        farms,
        cropTypes,
        varieties,
        pests,
        diseases

    ] = await Promise.all([

        getFarms(),
        getCropTypes(),
        getVarieties(),
        getPests(),
        getDiseases()

    ]);

    return {

        farms,

        cropTypes,

        varieties,

        pests,

        diseases

    };

}

/**
 * ----------------------------------------------------------
 * Exports
 * ----------------------------------------------------------
 */

module.exports = {

    getReferenceData,

    getFarms,

    getCropTypes,

    getVarieties,

    getPests,

    getDiseases

};