"use strict";
const { query } = require("./db");

async function snapshot(user) {
  if (!user?.id) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  const totals = await query(`
    SELECT
      COUNT(*)::int AS total_reports,
      COUNT(DISTINCT farm_id)::int AS farms,
      COUNT(*) FILTER (WHERE status='Critical')::int AS critical,
      COUNT(*) FILTER (WHERE status='Completed')::int AS completed,
      COUNT(*) FILTER (WHERE status='Pending')::int AS pending
    FROM scout_reports
  `);
  const workflow = await query(`
    SELECT stage, COUNT(*)::int AS count
    FROM report_workflows
    GROUP BY stage
    ORDER BY stage
  `);
  const byCrop = await query(`
    SELECT crop_type AS label, COUNT(*)::int AS count
    FROM scout_reports
    GROUP BY crop_type
    ORDER BY count DESC, label
    LIMIT 12
  `);
  const byFarm = await query(`
    SELECT farm_name AS label, COUNT(*)::int AS count
    FROM scout_reports
    GROUP BY farm_name
    ORDER BY count DESC, label
    LIMIT 12
  `);
  const byMonth = await query(`
    SELECT TO_CHAR(date_trunc('month', report_date), 'YYYY-MM') AS label,
           COUNT(*)::int AS count
    FROM scout_reports
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
  const recent = await query(`
    SELECT sr.id, sr.farm_name, sr.crop_type, sr.variety, sr.report_date,
           sr.status, sr.owner_id, u.name AS owner_name, rw.stage
    FROM scout_reports sr
    LEFT JOIN users u ON u.id=sr.owner_id
    LEFT JOIN report_workflows rw ON rw.report_id=sr.id
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
    ORDER BY uploaded_at DESC
    LIMIT 1
  `);
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
  };
}

module.exports = { snapshot };
