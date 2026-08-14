/**
 * ============================================================
 * Scout Report API
 * ============================================================
 *
 * File:
 * server/routes/auth.routes.js
 *
 * Authentication Routes
 *
 * Base URL
 * ------------------------------------------------------------
 * /auth
 *
 * Public
 * ------------------------------------------------------------
 * POST /auth/register
 * POST /auth/login
 *
 * Protected
 * ------------------------------------------------------------
 * POST /auth/logout
 * GET  /auth/me
 *
 * ============================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../auth");
const { createRateLimiter } = require("../middleware/rateLimit");

// ============================================================
// Rate Limiter
// ============================================================

const authenticationAttemptLimiter = createRateLimiter({

    windowMs: 15 * 60 * 1000,

    max: 10,

    keyGenerator: (req) => `${req.ip}:${req.path}`

});

// ============================================================
// Registration
// POST /auth/register
// ============================================================

router.post(
    "/register",
    authenticationAttemptLimiter,
    authController.register
);

// ============================================================
// Login
// POST /auth/login
// ============================================================

router.post(
    "/login",
    authenticationAttemptLimiter,
    authController.login
);

// ============================================================
// Logout
// POST /auth/logout
// ============================================================

router.post(
    "/logout",
    auth.authenticate,
    authController.logout
);

// ============================================================
// Current User
// GET /auth/me
// ============================================================

router.get(
    "/me",
    auth.authenticate,
    authController.me
);

// ============================================================
// Verify Session
// GET /auth/verify
//
// Used by the website to check whether the current
// cookie/session is still valid.
// ============================================================

router.get(
    "/verify",
    auth.authenticate,
    (req, res) => {

        res.status(200).json({

            success: true,

            authenticated: true,

            user: req.user,

            session: req.session

        });

    }
);

// ============================================================
// Authentication 404
// ============================================================

router.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Authentication endpoint not found",

        method: req.method,

        path: req.originalUrl

    });

});

module.exports = router;