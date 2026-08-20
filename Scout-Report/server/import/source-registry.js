"use strict";

const registry = require("../../docs/next-phases/import-mapping/source-adapters.json");
const { normalizeHeader } = require("./normalize");

function getAdapter(id) {
  return registry.adapters.find((adapter) => adapter.id === id) || null;
}

function headerSet(row) {
  return new Set(Object.keys(row || {}).map(normalizeHeader));
}

function scoreAdapter(adapter, row) {
  const headers = headerSet(row);
  let score = 0;
  for (const alias of Object.keys(adapter.aliases || {})) {
    if (headers.has(normalizeHeader(alias))) score += 2;
  }
  for (const field of adapter.required || []) {
    if (headers.has(normalizeHeader(field))) score += 5;
  }
  for (const signature of adapter.signature || []) {
    if (headers.has(normalizeHeader(signature))) score += 8;
  }
  return score;
}

function detectAdapter(row) {
  const candidates = registry.adapters
    .filter((adapter) => adapter.id !== "generic_wide_legacy")
    .map((adapter) => ({ adapter, score: scoreAdapter(adapter, row) }))
    .sort((a, b) => b.score - a.score);

  return candidates[0] && candidates[0].score > 0
    ? candidates[0]
    : { adapter: getAdapter("generic_wide_legacy"), score: 0 };
}

function resolveAliases(adapter) {
  return Object.fromEntries(
    Object.entries(adapter.aliases || {}).map(([source, target]) => [normalizeHeader(source), target])
  );
}

module.exports = { registry, getAdapter, detectAdapter, resolveAliases };
