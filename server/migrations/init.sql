-- Farms table
CREATE TABLE farms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop types table
CREATE TABLE crop_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop varieties table
CREATE TABLE crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_type_id VARCHAR(50) NOT NULL REFERENCES crop_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pests table
CREATE TABLE pests (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diseases table
CREATE TABLE diseases (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scout reports table
CREATE TABLE scout_reports (
  id VARCHAR(50) PRIMARY KEY,
  farm_id VARCHAR(50) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  is_greenhouse BOOLEAN DEFAULT FALSE,
  report_date DATE NOT NULL,
  implementation_week INTEGER,
  implementation_year INTEGER,
  weather VARCHAR(50),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  location JSONB,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pest observations table
CREATE TABLE pest_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  pest_type VARCHAR(255) NOT NULL,
  count INTEGER DEFAULT 0,
  severity VARCHAR(50) NOT NULL,
  affected_percent DECIMAL(5, 2) DEFAULT 0,
  location_on_plant VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disease observations table
CREATE TABLE disease_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  disease_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  affected_percent DECIMAL(5, 2) DEFAULT 0,
  spot_count INTEGER DEFAULT 0,
  spot_color VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_scout_reports_farm_id ON scout_reports(farm_id);
CREATE INDEX idx_scout_reports_status ON scout_reports(status);
CREATE INDEX idx_scout_reports_report_date ON scout_reports(report_date);
CREATE INDEX idx_pest_observations_report_id ON pest_observations(report_id);
CREATE INDEX idx_disease_observations_report_id ON disease_observations(report_id);

-- Seed reference data
INSERT INTO farms (id, name, location) VALUES
  ('FARM-001', 'Green Valley Farm', 'East County'),
  ('FARM-002', 'Sunset Ridge Farm', 'North Valley'),
  ('FARM-003', 'Highland Plains Farm', 'Central Region')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crop_types (id, name) VALUES
  ('CROP-001', 'Tomato'),
  ('CROP-002', 'Pepper'),
  ('CROP-003', 'Cucumber'),
  ('CROP-004', 'Lettuce')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crop_varieties (crop_type_id, name) VALUES
  ('CROP-001', 'Cherry Tomato'),
  ('CROP-001', 'Beefsteak Tomato'),
  ('CROP-001', 'Roma Tomato'),
  ('CROP-002', 'Bell Pepper'),
  ('CROP-002', 'Jalapeño'),
  ('CROP-002', 'Poblano'),
  ('CROP-003', 'English Cucumber'),
  ('CROP-003', 'Pickling Cucumber'),
  ('CROP-004', 'Butterhead Lettuce'),
  ('CROP-004', 'Romaine Lettuce')
ON CONFLICT DO NOTHING;

INSERT INTO pests (id, name, description) VALUES
  ('PEST-001', 'Whitefly', 'Small white insects'),
  ('PEST-002', 'Aphid', 'Green or black small insects'),
  ('PEST-003', 'Spider Mite', 'Tiny red or yellow mites'),
  ('PEST-004', 'Thrips', 'Thin elongated insects'),
  ('PEST-005', 'Mealybug', 'White fuzzy insects')
ON CONFLICT (id) DO NOTHING;

INSERT INTO diseases (id, name, description) VALUES
  ('DISEASE-001', 'Early Blight', 'Brown spots on leaves'),
  ('DISEASE-002', 'Late Blight', 'Water-soaked spots'),
  ('DISEASE-003', 'Powdery Mildew', 'White coating on leaves'),
  ('DISEASE-004', 'Fusarium Wilt', 'Wilting and yellowing'),
  ('DISEASE-005', 'Septoria Leaf Spot', 'Gray circular spots')
ON CONFLICT (id) DO NOTHING;
