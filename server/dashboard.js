"use strict";
const { query } = require("./db");
const { ROLES, ADMIN_ANALYTICS_STAGES } = require("./workflow");
let workbookBreakdown;

async function snapshot(user, batchId = null) {
  if (!user?.id) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  const adminStages = user.role === ROLES.ADMIN ? ADMIN_ANALYTICS_STAGES : null;
  const reportQuery = (sql) => query(`
    WITH visible_reports AS (
      SELECT sr.*, rw.stage
      FROM scout_reports sr
      LEFT JOIN report_workflows rw ON rw.report_id = sr.id
      WHERE ($1::varchar[] IS NULL OR rw.stage = ANY($1::varchar[]))
    )
    ${sql}
  `, [adminStages]);
  const totals = await reportQuery(`
    SELECT
      COUNT(*)::int AS total_reports,
      COUNT(DISTINCT farm_id)::int AS farms,
      COUNT(*) FILTER (WHERE status='Critical')::int AS critical,
      COUNT(*) FILTER (WHERE status='Completed')::int AS completed,
      COUNT(*) FILTER (WHERE status='Pending')::int AS pending
    FROM visible_reports
  `);
  const workflow = await reportQuery(`
    SELECT stage, COUNT(*)::int AS count
    FROM visible_reports
    WHERE stage IS NOT NULL
    GROUP BY stage
    ORDER BY stage
  `);
  const byCrop = await reportQuery(`
    SELECT crop_type AS label, COUNT(*)::int AS count
    FROM visible_reports
    GROUP BY crop_type
    ORDER BY count DESC, label
    LIMIT 12
  `);
  const byFarm = await reportQuery(`
    SELECT farm_name AS label, COUNT(*)::int AS count
    FROM visible_reports
    GROUP BY farm_name
    ORDER BY count DESC, label
    LIMIT 12
  `);
  const byMonth = await reportQuery(`
    SELECT TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS label,
           COUNT(*)::int AS count
    FROM visible_reports
    WHERE report_date >= CURRENT_DATE - INTERVAL '11 months'
    GROUP BY date_trunc('month', report_date)
    ORDER BY label
  `);
  const byRole = await query(`
    SELECT role AS label, COUNT(*)::int AS count
    FROM users
    WHERE is_active = true
    GROUP BY role
    ORDER BY count DESC, role
  `);
  const recent = await reportQuery(`
    SELECT sr.id, sr.farm_name, sr.crop_type, sr.variety, sr.report_date,
           sr.status, sr.owner_id, u.name AS owner_name, sr.stage
    FROM visible_reports sr
    LEFT JOIN users u ON u.id=sr.owner_id
    ORDER BY sr.created_at DESC, sr.id DESC
    LIMIT 20
  `);
  const reference = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM farms) AS farms,
      (SELECT COUNT(*)::int FROM crop_types) AS crop_types,
      (SELECT COUNT(*)::int FROM crop_varieties) AS varieties,
      (SELECT COUNT(*)::int FROM pests) AS pests,
      (SELECT COUNT(*)::int FROM diseases) AS diseases
  `);
  const latestImport = await query(`
    SELECT id, source_name, status, total_rows, accepted_rows, rejected_rows,
           committed_rows, uploaded_at, committed_at
    FROM report_import_batches
    ORDER BY uploaded_at DESC, id DESC
    LIMIT 1
  `);
  const masterImport = await getMasterImport(batchId);

  return {
    role: user.role,
    refreshedAt: new Date().toISOString(),
    totals: totals.rows[0],
    workflow: workflow.rows,
    byCrop: byCrop.rows,
    byFarm: byFarm.rows,
    byMonth: byMonth.rows,
    byRole: byRole.rows,
    recent: recent.rows,
    reference: reference.rows[0],
    latestImport: latestImport.rows[0] || null,
    masterImport,
  };
}

async function getMasterImport(batchId) {
  const result = await query(`
    SELECT id, source_name, total_rows, accepted_rows, rejected_rows, committed_rows
    FROM report_import_batches
    WHERE source_sheet = 'Clean Data' AND ($1::varchar IS NULL OR id = $1)
    ORDER BY uploaded_at DESC, id DESC
    LIMIT 1
  `, [batchId]);
  const batch = result.rows[0];
  if (!batch && batchId) {
    throw Object.assign(new Error('Workbook analytics batch was not found'), { statusCode: 404 });
  }
  if (!batch) return null;

  if (workbookBreakdown?.id !== batch.id) {
    const current = { id: batch.id };
    current.result = summarizeWorkbook(batch.id, batch.total_rows).catch((error) => {
      if (workbookBreakdown === current) workbookBreakdown = undefined;
      throw error;
    });
    workbookBreakdown = current;
  }
  return { ...batch, ...await workbookBreakdown.result };
}

async function summarizeWorkbook(batchId, totalRows) {
  const breakdown = await query(`
    WITH source AS (
      SELECT NULLIF(TRIM(source_payload->>'Farm'), '') AS farm,
             NULLIF(TRIM(source_payload->>'Crop'), '') AS crop,
             NULLIF(TRIM(source_payload->>'WEEK'), '') AS week
      FROM report_import_rows
      WHERE batch_id = $1
    ), counts AS (
      SELECT CASE WHEN GROUPING(farm) = 0 THEN 'farm'
                  WHEN GROUPING(crop) = 0 THEN 'crop'
                  ELSE 'week' END AS dimension,
             COALESCE(farm, crop, week, 'Blank') AS label,
             COUNT(*)::int AS count
      FROM source
      GROUP BY GROUPING SETS ((farm), (crop), (week))
    )
    SELECT dimension, label, count
    FROM counts
    ORDER BY count DESC, label
  `, [batchId]);

  const forDimension = (dimension) => breakdown.rows
    .filter((row) => row.dimension === dimension)
    .map(({ label, count }) => ({ label, count }));
  const byWeek = forDimension("week")
    .filter(({ label }) => /^(?:[1-9]|[1-4][0-9]|5[0-3])$/.test(label))
    .sort((a, b) => Number(a.label) - Number(b.label));
  return {
    byFarm: forDimension("farm").slice(0, 12),
    byCrop: forDimension("crop").slice(0, 12),
    byWeek,
    rowsWithoutValidWeek: totalRows - byWeek.reduce((total, item) => total + item.count, 0),
  };
}

module.exports = { snapshot };
