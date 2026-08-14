"use strict";

const crypto = require("crypto");
const { query } = require("./db");

const DOMAINS = Object.freeze({
  stops: { table: "report_survey_stops", fields: ["sequence_no","latitude","longitude","gps_accuracy_m","location_label","sampling_method","sample_size","sample_unit","notes"] },
  cropObservations: { table: "crop_observations", fields: ["survey_stop_id","growth_stage","plant_height","plant_population","good_plants","stand_percent","row_width","plant_spacing","root_development","vigour","notes"] },
  soilObservations: { table: "soil_observations", fields: ["survey_stop_id","moisture_status","moisture_percent","ph","ec","texture","drainage","soil_temperature","notes"] },
  irrigationObservations: { table: "irrigation_observations", fields: ["survey_stop_id","irrigation_method","irrigation_status","frequency","duration_minutes","estimated_volume","volume_unit","water_source","water_stress","notes"] },
  weatherObservations: { table: "weather_observations", fields: ["observed_at","temperature_c","humidity_percent","wind_speed","wind_direction","cloud_cover","rainfall_mm","leaf_wetness","source"] },
  weeds: { table: "weed_observations", fields: ["survey_stop_id","weed_type","scientific_name","pressure","average_height","max_height","density","affected_percent","growth_stage","notes"], required: ["weed_type"] },
  nutrients: { table: "nutrient_observations", fields: ["survey_stop_id","nutrient","deficiency_level","symptom_description","affected_percent","suspected_cause","notes"], required: ["nutrient"] },
  stress: { table: "stress_observations", fields: ["survey_stop_id","stress_type","severity","affected_percent","cause","description","notes"], required: ["stress_type"] },
  actions: { table: "management_actions", fields: ["action_type","target_type","target_name","product_name","active_ingredient","rate_value","rate_unit","method","action_date","responsible_user_id","status","follow_up_date","outcome"], required: ["action_type"] },
  recommendations: { table: "recommendations", fields: ["priority","recommendation_type","recommendation_text","owner_user_id","due_date","status","completed_at"], required: ["recommendation_text"] },
  media: { table: "report_media", fields: ["survey_stop_id","observation_type","observation_id","file_name","storage_key","mime_type","file_size_bytes","sha256","captured_at","latitude","longitude","caption","uploaded_by"], required: ["file_name","storage_key"] },
  samples: { table: "diagnostic_samples", fields: ["survey_stop_id","sample_type","sample_code","requested_test","collected_at","submitted_at","diagnostic_result","reference_number","status","notes"], required: ["sample_code"] },
});

function domain(name) {
  const d = DOMAINS[name];
  if (!d) throw Object.assign(new Error(`Unknown observation domain: ${name}`), { statusCode: 400 });
  return d;
}

function validatePayload(name, payload) {
  const d = domain(name);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw Object.assign(new Error("Observation payload must be an object"), { statusCode: 400 });
  for (const field of d.required || []) if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") throw Object.assign(new Error(`${field} is required`), { statusCode: 400 });
}

async function insertObservation(name, reportId, payload, actor) {
  validatePayload(name, payload);
  const d = domain(name);
  const id = payload.id || `obs-${crypto.randomUUID()}`;
  const fields = ["id", "report_id", ...d.fields];
  const values = [id, reportId, ...d.fields.map((field) => payload[field] === undefined ? null : payload[field])];
  const placeholders = values.map((_, i) => `$${i + 1}`);
  const result = await query(`INSERT INTO ${d.table} (${fields.join(",")}) VALUES (${placeholders.join(",")}) RETURNING *`, values);
  return result.rows[0];
}

async function listObservations(name, reportId) {
  const d = domain(name);
  const result = await query(`SELECT * FROM ${d.table} WHERE report_id=$1 ORDER BY created_at, id`, [reportId]);
  return result.rows;
}

async function fullReport(reportId, actor) {
  const base = await query(
    `SELECT sr.*, rw.stage, rw.current_holder_user_id, holder.name AS current_holder_name, holder.role AS current_holder_role
       FROM scout_reports sr
       LEFT JOIN report_workflows rw ON rw.report_id=sr.id
       LEFT JOIN users holder ON holder.id=rw.current_holder_user_id
      WHERE sr.id=$1`, [reportId]
  );
  if (!base.rowCount) return null;
  const report = base.rows[0];
  const visible = actor?.role === "admin" || report.owner_id === actor?.id || report.current_holder_user_id === actor?.id;
  if (!visible) throw Object.assign(new Error("You do not have access to this report"), { statusCode: 403 });
  const out = { ...report, observations: {} };
  for (const name of Object.keys(DOMAINS)) out.observations[name] = await listObservations(name, reportId);
  const workflow = await query(`SELECT * FROM report_workflows WHERE report_id=$1`, [reportId]);
  const events = await query(`SELECT * FROM report_workflow_events WHERE report_id=$1 ORDER BY created_at,id`, [reportId]);
  out.workflow = workflow.rows[0] || null;
  out.workflowHistory = events.rows;
  return out;
}

module.exports = { DOMAINS, domain, validatePayload, insertObservation, listObservations, fullReport };
