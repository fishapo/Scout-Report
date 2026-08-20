-- Scout Report Phase 21: Canonical PostgreSQL data model
-- Depends on: 001/init.sql, 002_report_workflow.sql, 003_analytics_indexes.sql
-- Purpose: persist the Phase 20 approved canonical field contract without
-- replacing legacy report columns or bypassing the verification workflow.

BEGIN;

-- ------------------------------------------------------------
-- 1. Extend the report header with canonical, backward-compatible fields
-- ------------------------------------------------------------
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS organisation_id VARCHAR(50);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS grower_name VARCHAR(255);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS scout_name VARCHAR(255);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS field_name VARCHAR(255);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS field_area DECIMAL(14,4);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS field_area_unit VARCHAR(30);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS growth_stage VARCHAR(100);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS planting_date DATE;
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS expected_harvest_date DATE;
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS visit_purpose VARCHAR(255);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS scouting_pattern VARCHAR(100);
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS visit_started_at TIMESTAMP;
ALTER TABLE scout_reports ADD COLUMN IF NOT EXISTS visit_ended_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_scout_reports_field_date
  ON scout_reports(field_name, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_scout_reports_crop_stage_date
  ON scout_reports(crop_type, growth_stage, report_date DESC);

-- ------------------------------------------------------------
-- 2. Repeated field survey locations / sampling stops
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_survey_stops (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  gps_accuracy_m DECIMAL(8,2),
  location_label VARCHAR(255),
  sampling_method VARCHAR(100),
  sample_size DECIMAL(12,3),
  sample_unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, sequence_no),
  CONSTRAINT chk_survey_stop_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_survey_stop_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_survey_stop_accuracy CHECK (gps_accuracy_m IS NULL OR gps_accuracy_m >= 0),
  CONSTRAINT chk_survey_stop_sequence CHECK (sequence_no > 0),
  CONSTRAINT chk_survey_stop_sample_size CHECK (sample_size IS NULL OR sample_size >= 0)
);

-- ------------------------------------------------------------
-- 3. Crop condition / stand observations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  growth_stage VARCHAR(100),
  plant_height DECIMAL(10,2),
  plant_population DECIMAL(14,3),
  good_plants INTEGER,
  stand_percent DECIMAL(5,2),
  row_width DECIMAL(10,2),
  plant_spacing DECIMAL(10,2),
  root_development VARCHAR(100),
  vigour VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_crop_obs_population CHECK (plant_population IS NULL OR plant_population >= 0),
  CONSTRAINT chk_crop_obs_good_plants CHECK (good_plants IS NULL OR good_plants >= 0),
  CONSTRAINT chk_crop_obs_stand CHECK (stand_percent IS NULL OR stand_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_crop_obs_height CHECK (plant_height IS NULL OR plant_height >= 0),
  CONSTRAINT chk_crop_obs_spacing CHECK (row_width IS NULL OR row_width >= 0),
  CONSTRAINT chk_crop_obs_plant_spacing CHECK (plant_spacing IS NULL OR plant_spacing >= 0)
);

-- ------------------------------------------------------------
-- 4. Soil and water observations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS soil_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  moisture_status VARCHAR(50),
  moisture_percent DECIMAL(5,2),
  ph DECIMAL(5,2),
  ec DECIMAL(10,3),
  texture VARCHAR(100),
  drainage VARCHAR(100),
  soil_temperature DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_soil_moisture CHECK (moisture_percent IS NULL OR moisture_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_soil_ph CHECK (ph IS NULL OR ph BETWEEN 0 AND 14),
  CONSTRAINT chk_soil_ec CHECK (ec IS NULL OR ec >= 0)
);

CREATE TABLE IF NOT EXISTS irrigation_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  irrigation_method VARCHAR(100),
  irrigation_status VARCHAR(100),
  frequency VARCHAR(100),
  duration_minutes DECIMAL(10,2),
  estimated_volume DECIMAL(14,3),
  volume_unit VARCHAR(30),
  water_source VARCHAR(100),
  water_stress VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_irrigation_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT chk_irrigation_volume CHECK (estimated_volume IS NULL OR estimated_volume >= 0)
);

-- ------------------------------------------------------------
-- 5. Weather observations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  observed_at TIMESTAMP NOT NULL,
  temperature_c DECIMAL(6,2),
  humidity_percent DECIMAL(5,2),
  wind_speed DECIMAL(8,2),
  wind_direction VARCHAR(20),
  cloud_cover VARCHAR(50),
  rainfall_mm DECIMAL(10,2),
  leaf_wetness VARCHAR(50),
  source VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_weather_humidity CHECK (humidity_percent IS NULL OR humidity_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_weather_rainfall CHECK (rainfall_mm IS NULL OR rainfall_mm >= 0),
  CONSTRAINT chk_weather_wind CHECK (wind_speed IS NULL OR wind_speed >= 0)
);

-- ------------------------------------------------------------
-- 6. Weed observations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weed_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  weed_type VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255),
  pressure VARCHAR(50),
  average_height DECIMAL(10,2),
  max_height DECIMAL(10,2),
  density DECIMAL(12,3),
  affected_percent DECIMAL(5,2),
  growth_stage VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_weed_affected CHECK (affected_percent IS NULL OR affected_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_weed_density CHECK (density IS NULL OR density >= 0)
);

-- ------------------------------------------------------------
-- 7. Expanded pest observations
-- ------------------------------------------------------------
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS scientific_name VARCHAR(255);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS life_stage VARCHAR(100);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS sampling_method VARCHAR(100);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS sample_size DECIMAL(12,3);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS sample_unit VARCHAR(50);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS damage_type VARCHAR(100);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS economic_threshold DECIMAL(12,3);
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS beneficial_present BOOLEAN;
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL;
ALTER TABLE pest_observations ADD COLUMN IF NOT EXISTS management_recommended TEXT;

CREATE INDEX IF NOT EXISTS idx_pest_obs_stop ON pest_observations(survey_stop_id);
CREATE INDEX IF NOT EXISTS idx_pest_obs_type_report ON pest_observations(pest_type, report_id);

-- ------------------------------------------------------------
-- 8. Expanded disease observations
-- ------------------------------------------------------------
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS scientific_name VARCHAR(255);
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS incidence_percent DECIMAL(5,2);
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS symptom_type VARCHAR(255);
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS plant_part VARCHAR(100);
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS diagnostic_confidence VARCHAR(50);
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL;
ALTER TABLE disease_observations ADD COLUMN IF NOT EXISTS management_recommended TEXT;

CREATE INDEX IF NOT EXISTS idx_disease_obs_stop ON disease_observations(survey_stop_id);
CREATE INDEX IF NOT EXISTS idx_disease_obs_type_report ON disease_observations(disease_type, report_id);

-- ------------------------------------------------------------
-- 9. Nutrient and abiotic/mechanical stress
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrient_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  nutrient VARCHAR(100) NOT NULL,
  deficiency_level VARCHAR(50),
  symptom_description TEXT,
  affected_percent DECIMAL(5,2),
  suspected_cause TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_nutrient_affected CHECK (affected_percent IS NULL OR affected_percent BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS stress_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  stress_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),
  affected_percent DECIMAL(5,2),
  cause VARCHAR(255),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_stress_affected CHECK (affected_percent IS NULL OR affected_percent BETWEEN 0 AND 100)
);

-- ------------------------------------------------------------
-- 10. Actions and recommendations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS management_actions (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_name VARCHAR(255),
  product_name VARCHAR(255),
  active_ingredient VARCHAR(255),
  rate_value DECIMAL(12,3),
  rate_unit VARCHAR(50),
  method VARCHAR(100),
  action_date DATE,
  responsible_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  follow_up_date DATE,
  outcome TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_management_rate CHECK (rate_value IS NULL OR rate_value >= 0)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  priority VARCHAR(30) NOT NULL DEFAULT 'normal',
  recommendation_type VARCHAR(100),
  recommendation_text TEXT NOT NULL,
  owner_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 11. Evidence/media and diagnostic samples
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_media (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  observation_type VARCHAR(50),
  observation_id VARCHAR(50),
  file_name VARCHAR(255) NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes BIGINT,
  sha256 CHAR(64),
  captured_at TIMESTAMP,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  caption TEXT,
  uploaded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_media_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT chk_media_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_media_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS diagnostic_samples (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  survey_stop_id VARCHAR(50) REFERENCES report_survey_stops(id) ON DELETE SET NULL,
  sample_type VARCHAR(100),
  sample_code VARCHAR(100) NOT NULL UNIQUE,
  requested_test VARCHAR(255),
  collected_at TIMESTAMP,
  submitted_at TIMESTAMP,
  diagnostic_result TEXT,
  reference_number VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'collected',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 12. Import provenance and reconciliation
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_import_batches (
  id VARCHAR(50) PRIMARY KEY,
  source_name VARCHAR(255) NOT NULL,
  source_version VARCHAR(100),
  mapping_version VARCHAR(100) NOT NULL,
  uploaded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  file_sha256 CHAR(64),
  total_rows INTEGER NOT NULL DEFAULT 0,
  accepted_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'validated',
  CONSTRAINT chk_import_counts CHECK (
    total_rows >= 0 AND accepted_rows >= 0 AND rejected_rows >= 0 AND duplicate_rows >= 0
  )
);

CREATE TABLE IF NOT EXISTS report_import_rows (
  id VARCHAR(50) PRIMARY KEY,
  batch_id VARCHAR(50) NOT NULL REFERENCES report_import_batches(id) ON DELETE CASCADE,
  source_row_number INTEGER NOT NULL,
  canonical_report_id VARCHAR(50),
  source_payload JSONB NOT NULL,
  normalized_payload JSONB,
  validation_errors JSONB,
  row_status VARCHAR(30) NOT NULL,
  UNIQUE(batch_id, source_row_number),
  CONSTRAINT chk_import_row_number CHECK (source_row_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_report_stops_report ON report_survey_stops(report_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_crop_obs_report ON crop_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_soil_obs_report ON soil_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_obs_report ON irrigation_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_weather_report ON weather_observations(report_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_weed_report ON weed_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_report ON nutrient_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_stress_report ON stress_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_actions_report ON management_actions(report_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_report ON recommendations(report_id, status);
CREATE INDEX IF NOT EXISTS idx_media_report ON report_media(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_samples_report ON diagnostic_samples(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_batch_user ON report_import_batches(uploaded_by, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_rows_batch_status ON report_import_rows(batch_id, row_status);

COMMIT;
