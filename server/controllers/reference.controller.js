/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Reference Controller
 *
 * Responsibilities
 * ----------------
 * • Handle Reference API requests
 * • Call the Reference Model
 * • Return JSON responses
 * • Forward errors to the global error handler
 *
 * Endpoint
 * --------
 * GET /api/reference
 *
 * ==========================================================
 */

"use strict";

/**
 * ----------------------------------------------------------
 * Model
 * ----------------------------------------------------------
 */

const {

    getReferenceData

} = require("../models/reference.model");

/**
 * ----------------------------------------------------------
 * GET /api/reference
 * ----------------------------------------------------------
 *
 * Returns:
 *
 * {
 *     success: true,
 *     data: {
 *         farms,
 *         cropTypes,
 *         varieties,
 *         pests,
 *         diseases
 *     }
 * }
 *
 * ----------------------------------------------------------
 */

async function getReference(req, res, next) {

    try {

        const data = await getReferenceData();

        res.status(200).json({

            success: true,

            data

        });

    }
    catch (error) {

        next(error);

    }

}

/**
 * ----------------------------------------------------------
 * Exports
 * ----------------------------------------------------------
 */

module.exports = {

    getReference

};