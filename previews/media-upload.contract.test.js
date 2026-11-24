"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Scout form captures, previews, uploads, and queues private media", () => {
  const form = fs.readFileSync(path.join(__dirname, "user-form.html"), "utf8");
  const offline = fs.readFileSync(path.join(__dirname, "offline.js"), "utf8");
  assert.match(form, /id="report-media"/);
  assert.match(form, /image\/jpeg,image\/png,image\/webp,video\/mp4,video\/webm/);
  assert.match(form, /uploadMediaItems/);
  assert.match(form, /X-Media-Id/);
  assert.match(form, /10\*1024\*1024/);
  assert.match(offline, /media: window\.collectPendingMedia/);
  assert.match(offline, /window\.uploadMediaItems\(body\.id, item\.media\)/);
  assert.ok(offline.indexOf("uploadMediaItems(body.id") < offline.indexOf("await removePending"));
});

test("Scout form inline scripts remain syntactically valid", () => {
  const form = fs.readFileSync(path.join(__dirname, "user-form.html"), "utf8");
  const scripts = [...form.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  for (const source of scripts) assert.doesNotThrow(() => new Function(source));
});

test("server exposes authenticated raw media routes before the report detail route", () => {
  const routes = fs.readFileSync(path.join(__dirname, "..", "server", "routes", "report.routes.js"), "utf8");
  assert.match(routes, /express\.raw\(\{ type: \(\) => true, limit: "10mb" \}\)/);
  assert.match(routes, /reportMediaController\.upload/);
  assert.match(routes, /reportMediaController\.content/);
  assert.ok(routes.indexOf('"/:id/media"') < routes.indexOf('"/:id"'));
});

test("content security policy permits only local blob media previews", () => {
  const security = fs.readFileSync(path.join(__dirname, "..", "server", "middleware", "securityHeaders.js"), "utf8");
  assert.match(security, /img-src 'self' data: blob:/);
  assert.match(security, /media-src 'self' blob:/);
});
