/**
 * ==========================================================
 * Global Error Handler
 * ==========================================================
 *
 * Errors with a statusCode (AuthError from server/auth.js,
 * StoreError from server/store.js) are client errors
 * (validation, auth, not-found, etc.) - their message is
 * safe to return as-is.
 *
 * Anything else (no statusCode -> defaults to 500) is an
 * unexpected server-side failure. Its message is logged for
 * debugging but NOT sent to the client, since it can contain
 * internal details (stack traces, SQL, file paths). This
 * matches the expectation asserted in server/app.test.js
 * ("controller errors return safe client responses").
 *
 * ==========================================================
 */

module.exports = function errorHandler(err, req, res, next) {

    console.error(err);

    const statusCode = err.statusCode || 500;

    const message = statusCode >= 500
        ? "Internal server error"
        : (err.message || "Internal server error");

    res.status(statusCode).json({
        error: message
    });

};
