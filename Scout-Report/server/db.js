/**
 * PostgreSQL database module.
 *
 * dotenv is loaded here as well as from the application entry point so that
 * every consumer (tests, scripts, controllers and the server) sees the same
 * database configuration regardless of module-load order.
 */
"use strict";

const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const sslEnabled = process.env.DB_SSL === "true";
const dbPassword = process.env.DB_PASSWORD;

if (dbPassword == null || typeof dbPassword !== "string") {
    console.warn("WARNING: DB_PASSWORD is not configured. PostgreSQL authentication will fail until .env is corrected.");
}

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "scout_report",
    user: process.env.DB_USER || "scout_user",
    password: dbPassword || undefined,
    ssl: sslEnabled
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on("connect", () => console.log("✓ PostgreSQL connected"));
pool.on("error", (error) => console.error("PostgreSQL Pool Error", error));

async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        if (process.env.NODE_ENV === "development") {
            console.log(`SQL (${Date.now() - start} ms): ${text.replace(/\s+/g, " ").trim()}`);
        }
        return result;
    } catch (error) {
        console.error("Database Query Failed");
        console.error(text);
        console.error(error);
        throw error;
    }
}

async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function testConnection() {
    const result = await query("SELECT NOW() AS connected");
    console.log("\n======================================");
    console.log(" PostgreSQL Connected");
    console.log("======================================");
    console.log(result.rows[0].connected);
    console.log("");
}

async function getHealth() {
    try {
        await query("SELECT 1");
        return { status: "healthy", database: "connected" };
    } catch (_error) {
        return { status: "unhealthy", database: "disconnected" };
    }
}

async function close() {
    await pool.end();
}

module.exports = { pool, query, transaction, testConnection, getHealth, close };
