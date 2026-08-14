"use strict";

const dictionary = require("../docs/next-phases/data-model/field-dictionary.json");

const CANONICAL_FIELDS = Object.freeze(dictionary.fields.map((f) => f.canonical));

function firstDefined(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== "") ?? null;
}

function locationValues(report) {
  const loc = report?.location && typeof report.location === "object" ? report.location : {};
  return {
    latitude: firstDefined(loc.latitude, report.latitude),
    longitude: firstDefined(loc.longitude, report.longitude),
    gpsAccuracyM: firstDefined(loc.gpsAccuracyM, report.gpsAccuracyM),
  };
}

function canonicalFromReport(report, options = {}) {
  const pest = options.pestObservations?.[0] || report?.pestObservations?.[0] || {};
  const disease = options.diseaseObservations?.[0] || report?.diseaseObservations?.[0] || {};
  const weather = options.weatherObservations?.[0] || {};
  const crop = options.cropObservations?.[0] || {};
  const soil = options.soilObservations?.[0] || {};
  const irrigation = options.irrigationObservations?.[0] || {};
  const recommendation = options.recommendations?.[0] || {};
  const action = options.actions?.[0] || {};
  const sample = options.samples?.[0] || {};
  const loc = locationValues(report);
  const source = options.provenance || report?.provenance || {};

  const record = {
    reportId: firstDefined(report?.id, report?.reportId),
    organisationId: report?.organisationId,
    farmId: report?.farmId,
    farmName: report?.farmName,
    growerName: report?.growerName,
    scoutName: report?.scoutName,
    fieldName: report?.fieldName,
    latitude: loc.latitude,
    longitude: loc.longitude,
    gpsAccuracyM: loc.gpsAccuracyM,
    fieldArea: report?.fieldArea,
    fieldAreaUnit: report?.fieldAreaUnit,
    cropType: report?.cropType,
    variety: report?.variety,
    growthStage: firstDefined(crop.growth_stage, report?.growthStage),
    plantingDate: report?.plantingDate,
    expectedHarvestDate: report?.expectedHarvestDate,
    plantHeight: crop.plant_height,
    plantPopulation: crop.plant_population,
    rowWidth: crop.row_width,
    plantSpacing: crop.plant_spacing,
    vigour: crop.vigour,
    reportDate: report?.reportDate,
    visitPurpose: report?.visitPurpose,
    scoutingPattern: report?.scoutingPattern,
    visitStartedAt: report?.visitStartedAt,
    visitEndedAt: report?.visitEndedAt,
    weather: firstDefined(weather.source ? report?.weather : null, report?.weather),
    temperature: firstDefined(weather.temperature_c, report?.temperature),
    humidity: firstDefined(weather.humidity_percent, report?.humidity),
    windSpeed: weather.wind_speed,
    windDirection: weather.wind_direction,
    cloudCover: weather.cloud_cover,
    rainfallMm: weather.rainfall_mm,
    leafWetness: weather.leaf_wetness,
    soilMoistureStatus: soil.moisture_status,
    soilMoisturePercent: soil.moisture_percent,
    soilPh: soil.ph,
    soilEc: soil.ec,
    soilTexture: soil.texture,
    drainage: soil.drainage,
    soilTemperature: soil.soil_temperature,
    irrigationMethod: irrigation.irrigation_method,
    irrigationStatus: irrigation.irrigation_status,
    waterStress: irrigation.water_stress,
    weedType: options.weeds?.[0]?.weed_type,
    weedPressure: options.weeds?.[0]?.pressure,
    weedAverageHeight: options.weeds?.[0]?.average_height,
    weedMaxHeight: options.weeds?.[0]?.max_height,
    weedDensity: options.weeds?.[0]?.density,
    weedAffectedPercent: options.weeds?.[0]?.affected_percent,
    pestType: firstDefined(pest.pestType, pest.pest_type),
    pestScientificName: firstDefined(pest.pestScientificName, pest.scientific_name),
    pestLifeStage: firstDefined(pest.pestLifeStage, pest.life_stage),
    pestCount: firstDefined(pest.count, pest.pestCount),
    pestSamplingMethod: firstDefined(pest.samplingMethod, pest.sampling_method),
    pestAffectedPercent: firstDefined(pest.affectedPercent, pest.affected_percent),
    pestSeverity: firstDefined(pest.severity, pest.pestSeverity),
    economicThreshold: firstDefined(pest.economicThreshold, pest.economic_threshold),
    diseaseType: firstDefined(disease.diseaseType, disease.disease_type),
    diseaseScientificName: firstDefined(disease.diseaseScientificName, disease.scientific_name),
    diseaseSymptom: firstDefined(disease.symptom, disease.diseaseSymptom),
    diseaseSeverity: firstDefined(disease.severity, disease.diseaseSeverity),
    diseaseAffectedPercent: firstDefined(disease.affectedPercent, disease.affected_percent),
    diseasePlantPart: firstDefined(disease.plantPart, disease.affected_plant_part),
    diagnosticConfidence: disease.diagnostic_confidence,
    beneficialOrganism: options.beneficial?.[0]?.organism_type,
    beneficialCount: options.beneficial?.[0]?.count,
    overallPlantHealth: options.cropHealth?.[0]?.overall_plant_health,
    healthIssue: options.cropHealth?.[0]?.health_issue,
    healthAffectedPercent: options.cropHealth?.[0]?.affected_percent,
    plantPart: options.cropHealth?.[0]?.plant_part,
    suspectedCause: options.cropHealth?.[0]?.suspected_cause,
    managementAction: firstDefined(action.action_type, action.actionType),
    productName: firstDefined(action.product_name, action.productName),
    activeIngredient: firstDefined(action.active_ingredient, action.activeIngredient),
    rateValue: firstDefined(action.rate_value, action.rateValue),
    rateUnit: firstDefined(action.rate_unit, action.rateUnit),
    applicationMethod: firstDefined(action.method, action.application_method),
    recommendationText: recommendation.recommendation_text,
    recommendationPriority: recommendation.priority,
    followUpDate: recommendation.follow_up_date || recommendation.due_date,
    media: options.media?.[0] || null,
    sampleType: firstDefined(sample.sample_type, sample.sampleType),
    sampleCode: firstDefined(sample.sample_code, sample.sampleCode),
    requestedTest: firstDefined(sample.requested_test, sample.requestedTest),
    diagnosticResult: firstDefined(sample.diagnostic_result, sample.diagnosticResult),
    referenceNumber: firstDefined(sample.reference_number, sample.referenceNumber),
    sourceFileName: source.sourceFileName,
    sourceAdapterId: source.sourceAdapterId,
    mappingVersion: source.mappingVersion,
    sourceRowNumber: source.sourceRowNumber,
    notes: report?.notes,
  };

  for (const field of CANONICAL_FIELDS) if (!(field in record)) record[field] = null;
  return Object.fromEntries(CANONICAL_FIELDS.map((field) => [field, record[field] ?? null]));
}

function canonicalHeaders() { return [...CANONICAL_FIELDS]; }

function canonicalRow(record) {
  return CANONICAL_FIELDS.map((field) => record?.[field] ?? "");
}

function canonicalRecordFromRow(headers, row) {
  const out = {};
  headers.forEach((h, i) => { if (CANONICAL_FIELDS.includes(h)) out[h] = row[i] === "" || row[i] === undefined ? null : row[i]; });
  return out;
}

module.exports = { CANONICAL_FIELDS, canonicalHeaders, canonicalFromReport, canonicalRow, canonicalRecordFromRow };
