"use strict";

const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const media = require("./report-media");
const { close, query } = require("./db");

after(async () => close());

test("media signatures allow only the supported image and video formats", () => {
  assert.equal(media.detectMediaType(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0, 0, 0, 0, 0, 0, 0, 0])), "image/jpeg");
  assert.equal(media.detectMediaType(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])), "image/png");
  assert.equal(media.detectMediaType(Buffer.from("RIFF0000WEBP", "ascii")), "image/webp");
  assert.equal(media.detectMediaType(Buffer.from([0,0,0,0,0x66,0x74,0x79,0x70,0,0,0,0])), "video/mp4");
  assert.equal(media.detectMediaType(Buffer.from([0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0])), "video/webm");
  assert.equal(media.detectMediaType(Buffer.from("<svg><script>", "utf8")), null);
});

test("media names are metadata only and storage paths cannot escape the private root", () => {
  assert.equal(media.cleanFileName(encodeURIComponent("../field photo.jpg")), "field photo.jpg");
  assert.throws(() => media.absoluteStoragePath(path.join("..", "outside.jpg")), /Invalid media storage key/);
  assert.match(media.absoluteStoragePath(path.join("SR-000001", "media-safe.jpg")), /report-media/);
});

test("media limit is ten megabytes", () => {
  assert.equal(media.MAX_MEDIA_BYTES, 10 * 1024 * 1024);
  assert.equal(media.MAX_MEDIA_FILES_PER_REPORT, 10);
  assert.equal(media.MAX_MEDIA_TOTAL_BYTES, 50 * 1024 * 1024);
});

test("media binary and metadata persist together with replay protection", { skip: process.env.RUN_DB_TESTS !== "1" }, async (t) => {
  const report = await query("SELECT id FROM scout_reports ORDER BY created_at LIMIT 1");
  if (!report.rowCount) return t.skip("No report is available for the media persistence check");
  const reportId = report.rows[0].id;
  const requestedId = `media-test-${Date.now()}`;
  const png = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]);
  let stored;
  try {
    stored = await media.saveMedia({
      reportId,
      requestedId,
      fileName: "field-evidence.png",
      claimedType: "image/png",
      buffer: png,
      caption: "Automated media persistence check",
    });
    assert.equal(stored.replayed, false);
    assert.equal(stored.media.file_size_bytes, String(png.length));
    assert.equal((await fs.readFile(media.absoluteStoragePath(stored.media.storage_key))).equals(png), true);
    const replay = await media.saveMedia({ reportId, requestedId, fileName: "field-evidence.png", claimedType: "image/png", buffer: png });
    assert.equal(replay.replayed, true);
    assert.equal((await media.listMedia(reportId)).some(item => item.id === requestedId), true);
  } finally {
    await query("DELETE FROM report_media WHERE id=$1", [requestedId]);
    if (stored?.media?.storage_key) await fs.unlink(media.absoluteStoragePath(stored.media.storage_key)).catch(() => {});
  }
});
