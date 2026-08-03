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
 * • Call server/store.js (the PostgreSQL-backed store)
 * • Return response shapes that match the existing preview
 *   frontend (previews/user-form.html, previews/admin-
 *   dashboard.html), which expect raw arrays/objects, not an
 *   { success, data } envelope.
 *
 * NOTE: this replaces the previous version of this file,
 * which called server/models/reference.model.js. That model
 * duplicated store.js's queries under a different response
 * shape ({ success, data }) that the frontend does not
 * understand. store.js is the complete, tested implementation
 * (see server/store.test.js) and is now the single source of
 * truth for reference data. models/reference.model.js has
 * been removed.
 *
 * Endpoints
 * ---------
 * GET /farms
 * GET /crop-types
 * GET /crop-types/:id/varieties
 * GET /pests
 * GET /diseases
 *
 * ==========================================================
 */

"use strict";

const store = require("../store");

/**
 * ----------------------------------------------------------
 * GET /farms
 * ----------------------------------------------------------
 * Returns: [{ id, name, location }, ...]
 * ----------------------------------------------------------
 */
async function getFarms(req, res, next) {
    try {
        const { farms } = await store.getReference();
        res.json(farms);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /crop-types
 * ----------------------------------------------------------
 * Returns: [{ id, name, varieties: [...] }, ...]
 * ----------------------------------------------------------
 */
async function getCropTypes(req, res, next) {
    try {
        const { cropTypes } = await store.getReference();
        res.json(cropTypes);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /crop-types/:id/varieties
 * ----------------------------------------------------------
 * Returns: { varieties: ["Cherry Tomato", "Roma Tomato", ...] }
 * ----------------------------------------------------------
 */
async function getCropVarieties(req, res, next) {
    try {
        const varieties = await store.getCropVarieties(req.params.id);
        res.json({ varieties });
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /pests
 * ----------------------------------------------------------
 * Returns: [{ id, name, description }, ...]
 * ----------------------------------------------------------
 */
async function getPests(req, res, next) {
    try {
        const { pests } = await store.getReference();
        res.json(pests);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /diseases
 * ----------------------------------------------------------
 * Returns: [{ id, name, description }, ...]
 * ----------------------------------------------------------
 */
async function getDiseases(req, res, next) {
    try {
        const { diseases } = await store.getReference();
        res.json(diseases);
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    getFarms,
    getCropTypes,
    getCropVarieties,
    getPests,
    getDiseases
};
