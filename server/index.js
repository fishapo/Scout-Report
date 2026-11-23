/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * File:
 * server/index.js
 *
 * Application Entry Point
 *
 * Responsibilities
 * ----------------------------
 * • Load environment variables
 * • Verify PostgreSQL connection
 * • Create Express application
 * • Find an available port
 * • Start HTTP server
 * • Handle graceful shutdown
 * • Handle fatal application errors
 *
 * ==========================================================
 */

"use strict";

/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});



/*
|--------------------------------------------------------------------------
| Core Modules
|--------------------------------------------------------------------------
*/

const http = require("http");

/*
|--------------------------------------------------------------------------
| Local Modules
|--------------------------------------------------------------------------
*/

const { createApp } = require("./app");

const {

    testConnection,

    close

} = require("./db");

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_PORT = Number(process.env.PORT) || 3000;

const HOST = process.env.HOST || "0.0.0.0";

const NODE_ENV = process.env.NODE_ENV || "development";

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {

    let databaseAvailable = false;
    let server = null;
    let port = DEFAULT_PORT;

    try {

        validateProductionEnvironment();

        /*
        ------------------------------------------------------
        Verify PostgreSQL Connection
        ------------------------------------------------------
        */

        try {

            await testConnection();
            databaseAvailable = true;

        }

        catch (error) {

            console.warn("");
            console.warn("======================================");
            console.warn(" PostgreSQL unavailable; starting in degraded mode");
            console.warn("======================================");
            console.warn(error.message || error);
            console.warn("");

        }

        /*
        ------------------------------------------------------
        Find Available Port
        ------------------------------------------------------
        */

        const app = createApp();
        const listeningServer = await createListeningServer(app, HOST, DEFAULT_PORT);
        server = listeningServer.server;
        port = listeningServer.port;

        console.clear();

        console.log("");
        console.log("======================================");
        console.log("      Scout Report API Started");
        console.log("======================================");
        console.log(`Server       : http://${HOST}:${port}`);
        console.log(`Environment  : ${NODE_ENV}`);
        console.log(`Database     : ${databaseAvailable ? "PostgreSQL" : "PostgreSQL (unavailable)"}`);
        console.log("======================================");
        console.log("");

        if (port !== DEFAULT_PORT) {

            console.log(

                `⚠ Port ${DEFAULT_PORT} is busy. Using ${port}.`

            );

            console.log("");

        }

        /*
        ------------------------------------------------------
        Graceful Shutdown
        ------------------------------------------------------
        */

        let shuttingDown = false;

async function shutdown(signal) {

    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log("");
    console.log(`${signal} received.`);
            console.log("Shutting down Scout Report API...");
            console.log("");

         if (!server) {

    await close();

    process.exit(0);

}


server.close(async () => {

    try {

        await close();

        console.log("✓ PostgreSQL pool closed.");

    }

    catch (error) {

        console.error(
            "Shutdown database error:",
            error
        );

    }

    console.log("✓ Server stopped.");

    process.exit(0);

});

        }

        process.on(

            "SIGINT",

            () => shutdown("SIGINT")

        );

        process.on(

            "SIGTERM",

            () => shutdown("SIGTERM")

        );

        return {
            started: true,
            server,
            port,
            databaseAvailable
        };

    }

    catch (error) {

        console.error("");
        console.error("======================================");
        console.error(" Scout Report API Failed to Start");
        console.error("======================================");
        console.error(error);
        console.error("");

        process.exit(1);

        return {
            started: false,
            error
        };

    }

}

function validateProductionEnvironment() {

    if (NODE_ENV !== "production") return;

    const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET"];
    const missing = required.filter((name) => !process.env[name]);

    if (missing.length > 0) {
        throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }

    if (process.env.JWT_SECRET === "development-only-change-me") {
        throw new Error("JWT_SECRET must not use the development fallback in production");
    }

}

async function createListeningServer(app, host, startingPort) {
    let currentPort = startingPort;
    const maxPort = startingPort + 10;

    while (currentPort <= maxPort) {
        const server = http.createServer(app);

        try {
            await new Promise((resolve, reject) => {
                server.once("error", reject);
                server.once("listening", resolve);
                server.listen(currentPort, host);
            });

            return { server, port: currentPort };
        } catch (error) {
            server.close?.();

            if (error.code === "EADDRINUSE") {
                currentPort += 1;
                continue;
            }

            throw error;
        }
    }

    throw new Error(`Unable to find an available port between ${startingPort} and ${maxPort}`);
}

/*
|--------------------------------------------------------------------------
| Global Error Handling
|--------------------------------------------------------------------------
*/

process.on(

    "uncaughtException",

    error => {

        console.error("");
        console.error("======================================");
        console.error(" Uncaught Exception");
        console.error("======================================");
        console.error(error);
        console.error("");

        process.exit(1);

    }

);

process.on(

    "unhandledRejection",

    reason => {

        console.error("");
        console.error("======================================");
        console.error(" Unhandled Promise Rejection");
        console.error("======================================");
        console.error(reason);
        console.error("");

        process.exit(1);

    }

);

/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/

if (require.main === module) {
    startServer();
}

module.exports = {
    startServer,
    createListeningServer,
    validateProductionEnvironment
};
