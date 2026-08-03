/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Auth Controller
 *
 * Responsibilities
 * ----------------
 * • Handle HTTP requests for /auth/*
 * • Delegate all real work to ../auth.js (registerUser,
 *   loginUser, logoutSession, session lookup)
 * • Translate AuthError -> JSON error responses via next(err)
 *
 * This file intentionally contains no business logic of its
 * own — server/auth.js already implements password hashing,
 * JWT signing/verification, and session management and is
 * unit-tested in server/auth.test.js.
 *
 * ==========================================================
 */

"use strict";

const auth = require("../auth");

/**
 * ----------------------------------------------------------
 * POST /auth/register
 * ----------------------------------------------------------
 * Public. The first user to register becomes "admin";
 * everyone after that defaults to "scout" unless an
 * authenticated admin is making the request (handled inside
 * auth.registerUser via options.currentUser).
 * ----------------------------------------------------------
 */
async function register(req, res, next) {
    try {
        const result = await auth.registerUser(req.body, {
            currentUser: req.user || null
        });

        res.status(201).json({
            success: true,
            ...result
        });
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /auth/login
 * ----------------------------------------------------------
 */
async function login(req, res, next) {
    try {
        const result = await auth.loginUser(req.body);

        res.status(200).json({
            success: true,
            ...result
        });
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /auth/logout
 * ----------------------------------------------------------
 * Requires auth.authenticate to have run first (req.session).
 * ----------------------------------------------------------
 */
async function logout(req, res, next) {
    try {
        await auth.logoutSession(req.session.id);

        res.status(200).json({
            success: true,
            message: "Logged out."
        });
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /auth/me
 * ----------------------------------------------------------
 * Requires auth.authenticate to have run first (req.user,
 * req.session).
 * ----------------------------------------------------------
 */
async function me(req, res, next) {
    try {
        res.status(200).json({
            success: true,
            user: req.user,
            session: req.session
        });
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout,
    me
};
