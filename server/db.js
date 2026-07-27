/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * PostgreSQL Database Module
 *
 * Responsibilities
 * ----------------
 * • Create PostgreSQL connection pool
 * • Execute SQL queries
 * • Run transactions
 * • Verify connectivity
 * • Close connections gracefully
 *
 * ==========================================================
 */

"use strict";

const { Pool } = require("pg");

/**
 * ----------------------------------------------------------
 * PostgreSQL Connection Pool
 * ----------------------------------------------------------
 */

const pool = new Pool({

    host: process.env.DB_HOST || "localhost",

    port: Number(process.env.DB_PORT) || 5432,

    database: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000

});

/**
 * ----------------------------------------------------------
 * Pool Events
 * ----------------------------------------------------------
 */

pool.on("connect", () => {

    console.log("✓ PostgreSQL connected");

});

pool.on("error", error => {

    console.error("PostgreSQL Pool Error");

    console.error(error);

});

/**
 * ----------------------------------------------------------
 * Execute Query
 * ----------------------------------------------------------
 */

async function query(text, params = []) {

    const start = Date.now();

    try {

        const result = await pool.query(text, params);

        const duration = Date.now() - start;

        if (process.env.NODE_ENV === "development") {

            console.log(

                `SQL (${duration} ms): ${text
                    .replace(/\s+/g, " ")
                    .trim()}`

            );

        }

        return result;

    }

    catch (error) {

        console.error("Database Query Failed");

        console.error(text);

        console.error(error);

        throw error;

    }

}

/**
 * ----------------------------------------------------------
 * Transaction Helper
 * ----------------------------------------------------------
 */

async function transaction(callback) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;

    }

    catch (error) {

        await client.query("ROLLBACK");

        throw error;

    }

    finally {

        client.release();

    }

}

/**
 * ----------------------------------------------------------
 * Test Database Connection
 * ----------------------------------------------------------
 */

async function testConnection() {

    const result = await query(

        "SELECT NOW() AS connected"

    );

    console.log("");

    console.log("======================================");

    console.log(" PostgreSQL Connected");

    console.log("======================================");

    console.log(result.rows[0].connected);

    console.log("");

}

/**
 * ----------------------------------------------------------
 * Close Pool
 * ----------------------------------------------------------
 */

async function close() {

    await pool.end();

}

/**
 * ----------------------------------------------------------
 * Exports
 * ----------------------------------------------------------
 */

module.exports = {

    pool,

    query,

    transaction,

    testConnection,

    close

};