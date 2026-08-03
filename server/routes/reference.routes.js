/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Reference Routes
 *
 * Public, read-only lookup data used to populate the scout
 * report form. No authentication required (matches
 * README.md, which does not list these under auth-required
 * endpoints).
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

const express = require("express");

const router = express.Router();

const referenceController = require("../controllers/reference.controller");

router.get("/farms", referenceController.getFarms);
router.get("/crop-types", referenceController.getCropTypes);
router.get("/crop-types/:id/varieties", referenceController.getCropVarieties);
router.get("/pests", referenceController.getPests);
router.get("/diseases", referenceController.getDiseases);

module.exports = router;
