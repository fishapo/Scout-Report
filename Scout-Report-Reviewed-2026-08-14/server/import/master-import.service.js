"use strict";

const crypto = require("crypto");
const { transaction, query } = require("../db");
const { readWorkbook, createWorkbook } = require("../xlsx-lite");
const mapper = require("./master-import");
const store = require("../store");
const { canonicalFromReport } = require("../canonical-report");
const masterCropCatalog = require("../data/master-crop-catalog.json");

function batchHash(b) { return crypto.createHash("sha256").update(b).digest("hex"); }

function rowsToObjects(rows) {
  const headers = (rows.shift() || []).map((v) => String(v ?? "").trim());
  return { headers, rows: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))) };
}

async function stageWorkbook(buffer, sourceName, actor) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw Object.assign(new Error("Empty workbook"), { statusCode: 400 });
  const rows = readWorkbook(buffer);
  const { rows: objects, headers } = rowsToObjects(rows);
  if (!headers.length) throw Object.assign(new Error("Workbook has no header row"), { statusCode: 400 });

  const batchId = mapper.createBatchId();
  const fileSha = batchHash(buffer);
  const mappingVersion = `phase26-master-${mapper.schemaHash().slice(0, 12)}`;
  const prepared = [];
  let accepted = 0;
  let rejected = 0;

  for (let i = 0; i < objects.length; i++) {
    const row = objects[i];
    if (!Object.values(row).some((v) => String(v ?? "").trim() !== "")) continue;
    try {
      const checked = mapper.validateSourceRow(row);
      const canonical = mapper.toCanonicalHeader(checked.normalized);
      const errors = checked.errors;
      const rowStatus = errors.length ? "rejected" : "validated";
      if (errors.length) rejected++; else accepted++;
      prepared.push({
        id: mapper.createRowId(),
        sourceRowNumber: i + 2,
        sourcePayload: row,
        normalizedPayload: { ...checked.normalized, canonical },
        errors,
        rowStatus,
      });
    } catch (e) {
      rejected++;
      prepared.push({ id: mapper.createRowId(), sourceRowNumber: i + 2, sourcePayload: row, normalizedPayload: null, errors: [e.message], rowStatus: "rejected" });
    }
  }

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO report_import_batches
       (id,source_name,source_version,mapping_version,uploaded_by,uploaded_at,file_sha256,total_rows,accepted_rows,rejected_rows,duplicate_rows,status,source_sheet,mapping_hash)
       VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8,$9,0,'validated',$10,$11)`,
      [batchId, sourceName || "Combined Scout Report Master.xlsx", "Combined Scout Report Master ver_24-2026", mappingVersion,
        actor?.id || null, fileSha, prepared.length, accepted, rejected, "Clean Data", mapper.schemaHash()]
    );
    for (let off = 0; off < prepared.length; off += 200) {
      const chunk = prepared.slice(off, off + 200);
      const values = [];
      const tuples = chunk.map((r, i) => {
        const b = i * 7;
        values.push(r.id, batchId, r.sourceRowNumber, JSON.stringify(r.sourcePayload), r.normalizedPayload ? JSON.stringify(r.normalizedPayload) : null, JSON.stringify(r.errors), r.rowStatus);
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4}::jsonb,$${b + 5}::jsonb,$${b + 6}::jsonb,$${b + 7})`;
      }).join(",");
      await client.query(
        `INSERT INTO report_import_rows
         (id,batch_id,source_row_number,source_payload,normalized_payload,validation_errors,row_status)
         VALUES ${tuples}`,
        values
      );
    }
  });

  return { batchId, sourceName, sourceSheet: "Clean Data", totalRows: prepared.length, acceptedRows: accepted, rejectedRows: rejected, fileSha256: fileSha, mappingVersion };
}

async function getBatch(batchId) {
  const b = await query("SELECT * FROM report_import_batches WHERE id=$1", [batchId]);
  if (!b.rowCount) return null;
  const s = await query("SELECT row_status,COUNT(*)::int AS count FROM report_import_rows WHERE batch_id=$1 GROUP BY row_status ORDER BY row_status", [batchId]);
  return { ...b.rows[0], rowSummary: s.rows };
}

async function resolveFarm(farmValue) {
  const value = String(farmValue ?? "").trim();
  if (!value) return null;
  let result = await query("SELECT id,name FROM farms WHERE lower(name)=lower($1) OR lower(id)=lower($1) LIMIT 1", [value]);
  if (result.rowCount) return result.rows[0];
  const m = /^(?:farm\s*[- ]?)?(\d{1,2}[ab]?)$/i.exec(value);
  if (m) {
    const suffix = m[1].toUpperCase();
    result = await query("SELECT id,name FROM farms WHERE lower(name)=lower($1) LIMIT 1", [`FARM ${suffix}`]);
    if (result.rowCount) return result.rows[0];
  }
  return null;
}

function catalogCropName(value) {
  const needle = String(value ?? "").trim().toLowerCase();
  if (!needle) return null;
  const found = masterCropCatalog.crops.find(c =>
    String(c.name ?? "").trim().toLowerCase() === needle ||
    (c.sourceCodes || []).some(code => String(code).trim().toLowerCase() === needle)
  );
  return found?.name || null;
}

async function resolveCrop(cropValue, varietyValue) {
  const varietyName = String(varietyValue ?? "").trim();
  let cropName = catalogCropName(cropValue) || String(cropValue ?? "").trim();
  let crop = cropName ? await query("SELECT id,name FROM crop_types WHERE lower(name)=lower($1) OR id=$1 LIMIT 1", [cropName]) : { rowCount: 0, rows: [] };

  // The master workbook contains some rows where Crop is blank but Variety is
  // populated. Infer the crop only when that variety belongs to exactly one
  // database crop, avoiding ambiguous guesses.
  if (!crop.rowCount && varietyName) {
    const inferred = await query(`
      SELECT ct.id, ct.name
      FROM crop_varieties cv
      JOIN crop_types ct ON ct.id=cv.crop_type_id
      WHERE lower(cv.name)=lower($1)
      GROUP BY ct.id, ct.name
      ORDER BY ct.name
    `, [varietyName]);
    if (inferred.rowCount === 1) crop = { rowCount: 1, rows: [inferred.rows[0]] };
  }
  if (!crop.rowCount) return null;
  const variety = await query("SELECT id,name FROM crop_varieties WHERE crop_type_id=$1 AND lower(name)=lower($2) LIMIT 1", [crop.rows[0].id, varietyName]);
  if (!variety.rowCount) return null;
  return { crop: crop.rows[0], variety: variety.rows[0] };
}

function importReportPayload(row, batch) {
  const n = row.normalized_payload || {};
  const canonicalHeader = n.canonical || mapper.toCanonicalHeader(n);
  const gh = String(n.gh ?? "").trim();
  const isGreenhouse = gh !== "" && !/^(field|open\s*field|shadenet|shade\s*net|no)$/i.test(gh);
  const reportDate = n.report_date || batch.uploaded_at?.toISOString?.().slice(0, 10) || new Date().toISOString().slice(0, 10);
  const pests = canonicalHeader.observations.pests.map((o) => ({
    pestType: o.sourceKey.replace(/_/g, " "), count: o.count, severity: o.count > 50 ? "High" : "Low", affectedPercent: Math.min(100, o.count), notes: `Source column: ${o.sourceKey}`,
  }));
  const diseases = canonicalHeader.observations.diseases.map((o) => ({
    diseaseType: o.sourceKey.replace(/_/g, " "), severity: o.affectedPercent > 50 ? "High" : "Low", affectedPercent: Math.min(100, o.affectedPercent), spotCount: o.affectedPercent, notes: `Source column: ${o.sourceKey}`,
  }));
  const base = {
    farmName: n.farm,
    cropType: n.crop,
    variety: n.variety,
    isGreenhouse,
    reportDate,
    implementationWeek: n.week,
    implementationYear: null,
    weather: "Sunny",
    masterObservations: n,
    pestObservations: pests,
    diseaseObservations: diseases,
    canonicalPayload: canonicalFromReport({ farmName: n.farm, cropType: n.crop, variety: n.variety, isGreenhouse, reportDate, implementationWeek: n.week, masterObservations: n, notes: null }, { pestObservations: pests, diseaseObservations: diseases, provenance: { sourceFileName: batch.source_name, sourceAdapterId: "phase26-master", mappingVersion: batch.mapping_version, sourceRowNumber: row.source_row_number } }),
  };
  return base;
}

async function exportSourceWorkbook(batchId) {
  const batchResult = await query("SELECT * FROM report_import_batches WHERE id=$1", [batchId]);
  if (!batchResult.rowCount) throw Object.assign(new Error("Import batch not found"), { statusCode: 404 });
  const rowsResult = await query("SELECT source_payload FROM report_import_rows WHERE batch_id=$1 ORDER BY source_row_number", [batchId]);
  const headers = mapper.schema.columns.map((c) => c.source_heading);
  const rows = rowsResult.rows.map((r) => headers.map((h) => r.source_payload?.[h] ?? ""));
  return createWorkbook([headers, ...rows], "Clean Data");
}

async function commitBatch(batchId, actor) {
  const batchResult = await query("SELECT * FROM report_import_batches WHERE id=$1", [batchId]);
  if (!batchResult.rowCount) throw Object.assign(new Error("Import batch not found"), { statusCode: 404 });
  const batch = batchResult.rows[0];
  const rowsResult = await query("SELECT * FROM report_import_rows WHERE batch_id=$1 AND row_status='validated' ORDER BY source_row_number", [batchId]);
  const results = [];

  for (const row of rowsResult.rows) {
    try {
      const farm = await resolveFarm(row.normalized_payload?.farm);
      if (!farm) throw new Error(`Farm reference not found: ${row.normalized_payload?.farm || ""}`);
      const crop = await resolveCrop(row.normalized_payload?.crop, row.normalized_payload?.variety);
      if (!crop) throw new Error(`Crop/variety reference not found: ${row.normalized_payload?.crop || ""} / ${row.normalized_payload?.variety || ""}`);
      const payload = importReportPayload(row, batch);
      payload.farmId = farm.id;
      payload.farmName = farm.name;
      payload.cropType = crop.crop.name;
      payload.variety = crop.variety.name;
      const report = await store.saveReport(payload, actor);
      await query(
        `UPDATE report_import_rows SET canonical_report_id=$1, canonical_payload=$2::jsonb, row_status='committed', committed_at=NOW(), commit_error=NULL WHERE id=$3`,
        [report.id, JSON.stringify(report.canonicalPayload || payload.canonicalPayload), row.id]
      );
      results.push({ row: row.source_row_number, reportId: report.id, status: "committed" });
    } catch (error) {
      await query("UPDATE report_import_rows SET row_status='commit_rejected', commit_error=$1 WHERE id=$2", [error.message, row.id]);
      results.push({ row: row.source_row_number, status: "rejected", error: error.message });
    }
  }

  const committed = results.filter((r) => r.status === "committed").length;
  await query(
    `UPDATE report_import_batches SET committed_rows=$1, committed_at=NOW(), status=$2 WHERE id=$3`,
    [committed, committed === rowsResult.rowCount ? "committed" : (committed ? "partially_committed" : "commit_failed"), batchId]
  );
  return { batchId, totalValidated: rowsResult.rowCount, committedRows: committed, results };
}

module.exports = { stageWorkbook, getBatch, exportSourceWorkbook, commitBatch };
