"use strict";

/**
 * Phase 20 canonical field dictionary.
 * This is the executable contract used by source mapping/validation.
 * Database migrations are deliberately deferred to Phase 21.
 */

const dictionary = require("../../docs/next-phases/data-model/field-dictionary.json");

const byCanonical = new Map(dictionary.fields.map((field) => [field.canonical, field]));

function getField(canonical) {
  return byCanonical.get(canonical) || null;
}

function listRequired() {
  return dictionary.fields.filter((field) => field.required);
}

function validateDictionary() {
  const errors = [];
  const seen = new Set();
  for (const field of dictionary.fields) {
    if (!field.canonical || !field.domain || !field.type) {
      errors.push(`Invalid field definition: ${JSON.stringify(field)}`);
      continue;
    }
    if (seen.has(field.canonical)) errors.push(`Duplicate canonical field: ${field.canonical}`);
    seen.add(field.canonical);
    if (!Array.isArray(field.aliases)) errors.push(`Aliases must be an array: ${field.canonical}`);
  }
  return errors;
}

module.exports = { dictionary, getField, listRequired, validateDictionary };
