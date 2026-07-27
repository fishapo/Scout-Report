/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Reference Routes
 *
 * Responsibilities
 * ----------------
 * • Expose lookup/reference endpoints
 *
 * Base Route
 * ----------
 * /api/reference
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

const {

    getReference

} = require("../controllers/reference.controller");

/**
 * ----------------------------------------------------------
 * GET /api/reference
 * ----------------------------------------------------------
 */

router.get(

    "/reference",

    getReference

);

/**
 * ----------------------------------------------------------
 * Exports
 * ----------------------------------------------------------
 */

module.exports = router;