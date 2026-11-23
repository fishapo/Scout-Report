"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const envPath = path.join(__dirname, "..", ".env");

async function rotateDatabasePassword() {
  const currentPassword = process.env.DB_PASSWORD;
  if (!currentPassword) throw new Error("DB_PASSWORD is missing from .env");

  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "scout_report",
    user: process.env.DB_USER || "scout_user",
    password: currentPassword,
  });
  const newPassword = crypto.randomBytes(36).toString("base64url");

  await client.connect();
  try {
    await client.query("SELECT set_config('scout.new_password', $1, false)", [newPassword]);
    await client.query("DO $$ BEGIN EXECUTE format('ALTER ROLE %I PASSWORD %L', current_user, current_setting('scout.new_password')); END $$");
  } finally {
    await client.end();
  }

  const source = fs.readFileSync(envPath, "utf8");
  const line = "DB_PASSWORD=" + newPassword;
  const updated = /^DB_PASSWORD=.*$/m.test(source)
    ? source.replace(/^DB_PASSWORD=.*$/m, line)
    : source.replace(/\s*$/, "") + "\n" + line + "\n";
  const temporaryPath = envPath + "." + process.pid + ".tmp";
  fs.writeFileSync(temporaryPath, updated, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryPath, envPath);
  console.log("Database password rotated and .env updated.");
}

rotateDatabasePassword().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
