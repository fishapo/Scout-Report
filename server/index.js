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

require("dotenv").config();



/*
|--------------------------------------------------------------------------
| Core Modules
|--------------------------------------------------------------------------
*/

const http = require("http");

const getPortModule = require("get-port");

const getPort =
    getPortModule.default || getPortModule;

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

const HOST = process.env.HOST || "localhost";

const NODE_ENV = process.env.NODE_ENV || "development";

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {

    try {

        /*
        ------------------------------------------------------
        Verify PostgreSQL Connection
        ------------------------------------------------------
        */

        await testConnection();

        /*
        ------------------------------------------------------
        Find Available Port
        ------------------------------------------------------
        */

        const port = await getPort({

            port: Array.from(

                { length: 20 },

                (_, index) => DEFAULT_PORT + index

            )

        });

        /*
        ------------------------------------------------------
        Create Express Application
        ------------------------------------------------------
        */

        const app = createApp();

        /*
        ------------------------------------------------------
        Create HTTP Server
        ------------------------------------------------------
        */

        const server = http.createServer(app);

        /*
        ------------------------------------------------------
        Start Listening
        ------------------------------------------------------
        */

        server.listen(port, () => {

            console.clear();

            console.log("");
            console.log("======================================");
            console.log("      Scout Report API Started");
            console.log("======================================");
            console.log(`Server       : http://${HOST}:${port}`);
            console.log(`Environment  : ${NODE_ENV}`);
            console.log("Database     : PostgreSQL");
            console.log("======================================");
            console.log("");

            if (port !== DEFAULT_PORT) {

                console.log(

                    `⚠ Port ${DEFAULT_PORT} is busy. Using ${port}.`

                );

                console.log("");

            }

        });

        /*
        ------------------------------------------------------
        Graceful Shutdown
        ------------------------------------------------------
        */

        async function shutdown(signal) {

            console.log("");
            console.log(`${signal} received.`);
            console.log("Shutting down Scout Report API...");
            console.log("");

            server.close(async () => {

                try {

                    await close();

                    console.log("✓ PostgreSQL pool closed.");

                }

                catch (error) {

                    console.error(error);

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

    }

    catch (error) {

        console.error("");
        console.error("======================================");
        console.error(" Scout Report API Failed to Start");
        console.error("======================================");
        console.error(error);
        console.error("");

        process.exit(1);

    }

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

startServer();