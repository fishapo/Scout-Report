/* Scout Report browser reference mapping
 * Resolves spreadsheet/master observation labels to the live PostgreSQL
 * reference IDs returned by /api/reference/pests and /api/reference/diseases.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.scoutReferenceMapping = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function compact(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function singular(value) {
    const text = compact(value);
    if (text.endsWith("ies")) return text.slice(0, -3) + "y";
    if (text.endsWith("sses")) return text.slice(0, -2);
    if (text.endsWith("s") && !text.endsWith("ss")) return text.slice(0, -1);
    return text;
  }

  function resolveReferenceId(label, references, aliases = []) {
    const refs = Array.isArray(references) ? references : [];
    const candidates = [label].concat(aliases).filter(Boolean);
    const exact = candidates.find(candidate =>
      refs.some(ref => String(ref.name || "").trim().toLowerCase() === String(candidate).trim().toLowerCase())
    );
    if (exact) return refs.find(ref =>
      String(ref.name || "").trim().toLowerCase() === String(exact).trim().toLowerCase()
    ).id;

    const compactCandidates = candidates.map(compact);
    const compactMatch = refs.find(ref => compactCandidates.includes(compact(ref.name)));
    if (compactMatch) return compactMatch.id;

    const singularCandidates = candidates.map(singular);
    const singularMatch = refs.find(ref => singularCandidates.includes(singular(ref.name)));
    return singularMatch ? singularMatch.id : null;
  }

  function resolveObservationReference(sourceKey, label, references, aliasMap) {
    const aliases = aliasMap && aliasMap[sourceKey] ? aliasMap[sourceKey] : [];
    return resolveReferenceId(label, references, aliases);
  }

  return { compact, singular, resolveReferenceId, resolveObservationReference };
});
