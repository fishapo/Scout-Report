"use strict";

const auth = require("../auth");

/**
 * Browser authentication adapter. Authentication itself is owned by the
 * canonical auth service, so cookies and Bearer tokens follow exactly the
 * same session-validation path. Browser failures are converted to /login.
 */
async function requirePageAuth(req, res, next) {
    try {
        if (typeof auth.authenticate !== "function") {
            return next(new Error("Authentication service unavailable"));
        }

        return auth.authenticate(req, res, (error) => {
            if (error) {
                if (error.statusCode === 401) return res.redirect("/login");
                return next(error);
            }
            return next();
        });
    } catch (error) {
        if (error?.statusCode === 401) return res.redirect("/login");
        return next(error);
    }
}

function requirePageRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.redirect("/login");
        if (!roles.includes(req.user.role)) return res.redirect("/dashboard");
        return next();
    };
}

module.exports = { requirePageAuth, requirePageRole };
