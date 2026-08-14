"use strict";

const CANONICAL_KEYS = {
  reportdate: "reportDate",
  farmid: "farmId",
  farmname: "farmName",
  croptype: "cropType",
  isgreenhouse: "isGreenhouse"
};

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = String(value).trim().toLowerCase();
  if (/^(yes|true|1|y)$/.test(text)) return true;
  if (/^(no|false|0|n)$/.test(text)) return false;
  throw new Error("Invalid boolean");
}

function normalizePercent(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/%/g, "").trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Invalid percentage");
  return n;
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString().slice(0, 10);
}

function mapRow(row, aliases = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    const header = normalizeHeader(key);
    const target = aliases[header] || CANONICAL_KEYS[header] || header;
    normalized[target] = value === "" ? null : value;
  }
  if ("reportDate" in normalized) normalized.reportDate = normalizeDate(normalized.reportDate);
  if ("report_date" in normalized) normalized.reportDate = normalizeDate(normalized.report_date);
  if ("date" in normalized && !normalized.reportDate) normalized.reportDate = normalizeDate(normalized.date);
  if ("isGreenhouse" in normalized) normalized.isGreenhouse = normalizeBoolean(normalized.isGreenhouse);
  if ("is_greenhouse" in normalized) normalized.isGreenhouse = normalizeBoolean(normalized.is_greenhouse);
  if ("affected_percent" in normalized) normalized.affectedPercent = normalizePercent(normalized.affected_percent);
  return normalized;
}

function validateCanonical(row) {
  const errors = [];
  for (const field of ["farmId", "farmName", "cropType", "reportDate"]) {
    if (!row[field]) errors.push({ field, message: `${field} is required` });
  }
  return errors;
}

module.exports = { normalizeHeader, normalizeBoolean, normalizePercent, normalizeDate, mapRow, validateCanonical };
