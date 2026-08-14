"use strict";

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const routes = require("./routes");
const referenceRoutes = require("./routes/reference.routes");
const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const { requestLogger } = require("./middleware/logger");
const securityHeaders = require("./middleware/securityHeaders");
const errorHandler = require("./middleware/errorHandler");
const { metricsMiddleware } = require("./metrics");
const { requirePageAuth, requirePageRole } = require("./middleware/requirePageAuth");

const PREVIEW_PATH = path.join(__dirname, "../previews");

function preview(file) {
    return path.join(PREVIEW_PATH, file);
}

function createApp() {
    const app = express();
    app.set("trust proxy", 1);

    app.use(securityHeaders);
    app.use(requestLogger);
    app.use(metricsMiddleware);
    app.use(cookieParser());
    app.use(express.json({ limit: "15mb" }));
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));

    // Only expose browser assets explicitly. HTML pages remain behind page auth.
    app.get("/assets/auth.js", (req, res, next) => {
        res.sendFile(preview("auth.js"), (err) => err && next(err));
    });
    app.get("/assets/admin-reference.js", (req, res, next) => {
        res.sendFile(preview("admin-reference.js"), (err) => err && next(err));
    });
    app.get("/assets/workflow-dashboard.js", (req, res, next) => {
        res.sendFile(preview("workflow-dashboard.js"), (err) => err && next(err));
    });
    app.use("/css", express.static(path.join(PREVIEW_PATH, "css")));
    app.use("/js", express.static(path.join(PREVIEW_PATH, "js")));
    app.use("/images", express.static(path.join(PREVIEW_PATH, "images")));

    // Public entry/auth pages.
    app.get("/", (req, res) => {
        if (req.cookies?.access_token) return res.redirect("/dashboard");
        return res.sendFile(preview("login.html"));
    });

    app.get("/login", (req, res) => res.sendFile(preview("login.html")));
    app.get("/signup", (req, res) => res.redirect("/login#register"));

    app.use("/auth", authRoutes);

    app.get("/health", (req, res) => {
        res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
    });

    // Canonical API. Individual API routes own their authentication.
    app.use("/api", routes);

    // Legacy reference paths retained for compatibility.
    app.use("/", referenceRoutes);

    // Shared analytics dashboard available to every authenticated application role.
    app.get("/dashboard.html", requirePageAuth, (req, res, next) =>
        res.sendFile(preview("dashboard.html"), (err) => err && next(err))
    );

    // Browser application routing.
    app.get("/dashboard", requirePageAuth, (req, res) => {
        const destinations = {
            admin: "/admin-dashboard.html",
            scout: "/scout-dashboard",
            inter_farm_supervisor: "/inter-farm-supervisor-dashboard",
            head_of_department: "/head-of-department-dashboard",
        };
        const destination = destinations[req.user.role];
        if (!destination) {
            return res.status(403).json({
                success: false,
                error: "Your account does not have a valid application role.",
                role: req.user.role || null,
            });
        }
        return res.redirect(destination);
    });

    app.get(
        "/scout-dashboard",
        requirePageAuth,
        requirePageRole("scout"),
        (req, res, next) => res.sendFile(preview("scout-dashboard.html"), (err) => err && next(err))
    );

    app.get(
        "/inter-farm-supervisor-dashboard",
        requirePageAuth,
        requirePageRole("inter_farm_supervisor"),
        (req, res, next) => res.sendFile(preview("inter-farm-supervisor-dashboard.html"), (err) => err && next(err))
    );

    app.get(
        "/head-of-department-dashboard",
        requirePageAuth,
        requirePageRole("head_of_department"),
        (req, res, next) => res.sendFile(preview("head-of-department-dashboard.html"), (err) => err && next(err))
    );

    app.get(
        "/admin-verification-dashboard",
        requirePageAuth,
        requirePageRole("admin"),
        (req, res, next) => res.sendFile(preview("admin-verification-dashboard.html"), (err) => err && next(err))
    );

    app.get(
        "/admin-users",
        requirePageAuth,
        requirePageRole("admin"),
        (req, res, next) => res.sendFile(preview("admin-users.html"), (err) => err && next(err))
    );

    app.get(
        "/scout-form",
        requirePageAuth,
        requirePageRole("scout", "inter_farm_supervisor", "head_of_department", "admin"),
        (req, res, next) => res.sendFile(preview("user-form.html"), (err) => err && next(err))
    );

    app.get(
        "/user-form.html",
        requirePageAuth,
        requirePageRole("scout", "inter_farm_supervisor", "head_of_department", "admin"),
        (req, res) => res.redirect("/scout-form")
    );

    app.get(
        "/admin-dashboard.html",
        requirePageAuth,
        requirePageRole("admin"),
        (req, res, next) => res.sendFile(preview("admin-dashboard.html"), (err) => err && next(err))
    );

    // Legacy report API. Canonical /api/reports is already mounted above.
    app.use("/scout-reports", reportRoutes);

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: "Endpoint not found",
            method: req.method,
            path: req.originalUrl,
        });
    });

    app.use(errorHandler);
    return app;
}

module.exports = { createApp };
