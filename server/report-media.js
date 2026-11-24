"use strict";

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { query } = require("./db");

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_MEDIA_FILES_PER_REPORT = 10;
const MAX_MEDIA_TOTAL_BYTES = 50 * 1024 * 1024;
const configuredStorage = process.env.MEDIA_STORAGE_DIR || path.join("var", "report-media");
const STORAGE_ROOT = path.resolve(path.isAbsolute(configuredStorage) ? configuredStorage : path.join(__dirname, "..", configuredStorage));
const MIME_EXTENSIONS = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
});

function detectMediaType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  return null;
}

function cleanFileName(value) {
  const decoded = decodeHeader(value);
  const base = path.basename(decoded).replace(/[\x00-\x1f\x7f]/g, "").trim();
  return (base || "evidence-file").slice(0, 255);
}

function decodeHeader(value) {
  try { return decodeURIComponent(String(value || "")); }
  catch (_error) { return String(value || ""); }
}

function mediaId(value) {
  if (value && /^media-[a-zA-Z0-9-]{1,44}$/.test(value)) return value;
  return `media-${crypto.randomUUID()}`;
}

function safeReportPart(reportId) {
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(String(reportId || ""))) {
    throw Object.assign(new Error("Invalid report identifier"), { statusCode: 400 });
  }
  return String(reportId);
}

function absoluteStoragePath(storageKey) {
  const absolute = path.resolve(STORAGE_ROOT, String(storageKey || ""));
  if (absolute !== STORAGE_ROOT && !absolute.startsWith(`${STORAGE_ROOT}${path.sep}`)) {
    throw Object.assign(new Error("Invalid media storage key"), { statusCode: 400 });
  }
  return absolute;
}

async function findMedia(reportId, id) {
  const result = await query("SELECT * FROM report_media WHERE report_id=$1 AND id=$2", [reportId, id]);
  return result.rows[0] || null;
}

async function listMedia(reportId) {
  const result = await query(
    `SELECT id, report_id, file_name, mime_type, file_size_bytes, sha256, captured_at,
            latitude, longitude, caption, uploaded_by, created_at
       FROM report_media WHERE report_id=$1 ORDER BY created_at, id`,
    [reportId]
  );
  return result.rows;
}

async function saveMedia({ reportId, requestedId, fileName, claimedType, buffer, caption, capturedAt, latitude, longitude, uploadedBy }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw Object.assign(new Error("A non-empty media file is required"), { statusCode: 400 });
  if (buffer.length > MAX_MEDIA_BYTES) throw Object.assign(new Error("Media files must be 10 MB or smaller"), { statusCode: 413 });
  const detectedType = detectMediaType(buffer);
  if (!detectedType || !MIME_EXTENSIONS[detectedType]) throw Object.assign(new Error("Only JPEG, PNG, WebP, MP4, and WebM media is supported"), { statusCode: 415 });
  if (claimedType && claimedType !== "application/octet-stream" && claimedType !== detectedType) {
    throw Object.assign(new Error("The file content does not match its declared media type"), { statusCode: 415 });
  }

  const id = mediaId(requestedId);
  const existing = await findMedia(reportId, id);
  if (existing) return { media: existing, replayed: true };
  const usage = await query(
    "SELECT COUNT(*)::int AS file_count, COALESCE(SUM(file_size_bytes),0)::bigint AS total_bytes FROM report_media WHERE report_id=$1",
    [reportId]
  );
  const fileCount = Number(usage.rows[0]?.file_count || 0);
  const totalBytes = Number(usage.rows[0]?.total_bytes || 0);
  if (fileCount >= MAX_MEDIA_FILES_PER_REPORT || totalBytes + buffer.length > MAX_MEDIA_TOTAL_BYTES) {
    throw Object.assign(new Error("This report has reached its media storage limit"), { statusCode: 413 });
  }

  const reportPart = safeReportPart(reportId);
  const storageKey = path.join(reportPart, `${id}${MIME_EXTENSIONS[detectedType]}`);
  const absolute = absoluteStoragePath(storageKey);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, buffer, { flag: "wx", mode: 0o600 });
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  try {
    const result = await query(
      `INSERT INTO report_media
         (id, report_id, file_name, storage_key, mime_type, file_size_bytes, sha256,
          captured_at, latitude, longitude, caption, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [id, reportId, cleanFileName(fileName), storageKey, detectedType, buffer.length, sha256,
       capturedAt || null, latitude, longitude, caption || null, uploadedBy || null]
    );
    return { media: result.rows[0], replayed: false };
  } catch (error) {
    await fs.unlink(absolute).catch(() => {});
    throw error;
  }
}

module.exports = {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_FILES_PER_REPORT,
  MAX_MEDIA_TOTAL_BYTES,
  STORAGE_ROOT,
  absoluteStoragePath,
  cleanFileName,
  decodeHeader,
  detectMediaType,
  findMedia,
  listMedia,
  saveMedia,
};
