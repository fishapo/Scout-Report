/**
 * ============================================================
 * Scout Report API
 * Express Application Configuration
 * ------------------------------------------------------------
 * Responsibilities
 *  - Configure Express
 *  - Register global middleware
 *  - Register application routes
 *  - Handle unknown routes
 *  - Handle application errors
 * ============================================================
 */

const express = require("express");

// ------------------------------------------------------------
// Route Registration
// ------------------------------------------------------------

const routes = require("./routes");

// ------------------------------------------------------------
// Global Middleware
// ------------------------------------------------------------

const { requestLogger } = require("./middleware/logger");
const securityHeaders = require("./middleware/securityHeaders");
const requireSiteAuth = require("./middleware/requireSiteAuth");
const errorHandler = require("./middleware/errorHandler");

/**
 * Creates and configures the Express application.
 *
 * @returns {Express.Application}
 */
function createApp() {

    //----------------------------------------------------------
    // Create Express App
    //----------------------------------------------------------

    const app = express();

    //----------------------------------------------------------
    // Security
    //----------------------------------------------------------

    app.use(securityHeaders);

    //----------------------------------------------------------
    // Logging
    //----------------------------------------------------------

    app.use(requestLogger);

    //----------------------------------------------------------
    // Body Parsing
    //----------------------------------------------------------

    app.use(express.json());

    app.use(
        express.urlencoded({
            extended: true
        })
    );

    //----------------------------------------------------------
    // Authentication
    //----------------------------------------------------------

    app.use(requireSiteAuth);

    //----------------------------------------------------------
    // Health Check
    //----------------------------------------------------------

    app.get("/health", (req, res) => {

        res.json({

            success: true,

            service: "Scout Report API",

            status: "Running",

            timestamp: new Date().toISOString()

        });

    });

    //----------------------------------------------------------
    // Application Routes
    //----------------------------------------------------------

    app.use(routes);

    //----------------------------------------------------------
    // Unknown Routes (404)
    //----------------------------------------------------------

    app.use((req, res) => {

        res.status(404).json({

            success: false,

            error: "Endpoint not found",

            method: req.method,

            path: req.originalUrl

        });

    });

    //----------------------------------------------------------
    // Global Error Handler
    //----------------------------------------------------------

    app.use(errorHandler);

    return app;

}

module.exports = {
    createApp
};