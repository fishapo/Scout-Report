"use strict";

const workflow = require("../workflow.store");
const { canEditReportData } = require("../report-permissions");
const mediaStore = require("../report-media");

async function visibleWorkflow(reportId, actor) {
  const current = await workflow.getWorkflow(reportId, actor);
  if (current) return current;
  throw Object.assign(new Error("Report workflow not found"), { statusCode: 404 });
}

async function editableWorkflow(reportId, actor) {
  const current = await visibleWorkflow(reportId, actor);
  if (canEditReportData(current, actor)) return current;
  throw Object.assign(new Error("You do not have permission to add media to this report"), { statusCode: 403 });
}

function optionalNumber(value, name, min, max) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw Object.assign(new Error(`${name} is invalid`), { statusCode: 400 });
  }
  return number;
}

async function upload(req, res, next) {
  try {
    await editableWorkflow(req.params.id, req.user);
    const capturedAt = req.get("x-captured-at") || null;
    if (capturedAt && Number.isNaN(Date.parse(capturedAt))) throw Object.assign(new Error("Captured date is invalid"), { statusCode: 400 });
    const result = await mediaStore.saveMedia({
      reportId: req.params.id,
      requestedId: req.get("x-media-id"),
      fileName: req.get("x-file-name"),
      claimedType: req.get("content-type"),
      buffer: req.body,
      caption: mediaStore.decodeHeader(req.get("x-caption")).slice(0, 2000),
      capturedAt,
      latitude: optionalNumber(req.get("x-latitude"), "Latitude", -90, 90),
      longitude: optionalNumber(req.get("x-longitude"), "Longitude", -180, 180),
      uploadedBy: req.user.id,
    });
    res.status(result.replayed ? 200 : 201).json({ success: true, replayed: result.replayed, media: result.media });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    await visibleWorkflow(req.params.id, req.user);
    res.json({ success: true, media: await mediaStore.listMedia(req.params.id) });
  } catch (error) { next(error); }
}

async function content(req, res, next) {
  try {
    await visibleWorkflow(req.params.id, req.user);
    const media = await mediaStore.findMedia(req.params.id, req.params.mediaId);
    if (!media) return res.status(404).json({ success: false, error: "Media not found" });
    res.type(media.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(media.file_name)}`);
    res.setHeader("Cache-Control", "private, no-store");
    res.sendFile(mediaStore.absoluteStoragePath(media.storage_key), (error) => error && next(error));
  } catch (error) { next(error); }
}

module.exports = { content, list, upload };
