/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Auth Routes
 *
 * Base Route
 * ----------
 * /auth
 *
 * Endpoints (matches README.md "API Endpoints" table)
 * ---------
 * POST /auth/register  - public
 * POST /auth/login     - public
 * POST /auth/logout    - requires authentication
 * GET  /auth/me        - requires authentication
 *
 * ==========================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/logout", auth.authenticate, authController.logout);
router.get("/me", auth.authenticate, authController.me);

module.exports = router;
