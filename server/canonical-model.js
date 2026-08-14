"use strict";

const TABLES = Object.freeze({
  surveyStops: "report_survey_stops",
  crop: "crop_observations",
  soil: "soil_observations",
  irrigation: "irrigation_observations",
  weather: "weather_observations",
  weed: "weed_observations",
  pest: "pest_observations",
  disease: "disease_observations",
  nutrient: "nutrient_observations",
  stress: "stress_observations",
  actions: "management_actions",
  recommendations: "recommendations",
  media: "report_media",
  samples: "diagnostic_samples",
  importBatches: "report_import_batches",
  importRows: "report_import_rows",
});

const REPORT_HEADER_FIELDS = Object.freeze([
  "organisationId", "growerName", "scoutName", "fieldName", "fieldArea",
  "fieldAreaUnit", "growthStage", "plantingDate", "expectedHarvestDate",
  "visitPurpose", "scoutingPattern", "visitStartedAt", "visitEndedAt",
]);

function getCanonicalModel() {
  return { tables: TABLES, reportHeaderFields: REPORT_HEADER_FIELDS };
}

module.exports = { TABLES, REPORT_HEADER_FIELDS, getCanonicalModel };
