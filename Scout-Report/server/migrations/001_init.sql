-- Farms table
CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop types table
CREATE TABLE IF NOT EXISTS crop_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop varieties table
CREATE TABLE IF NOT EXISTS crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_type_id VARCHAR(50) NOT NULL REFERENCES crop_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (crop_type_id, name)
);

-- Pests table
CREATE TABLE IF NOT EXISTS pests (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diseases table
CREATE TABLE IF NOT EXISTS diseases (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'scout',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('admin', 'scout'))
);

-- Sessions table for revocable JWT-backed login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scout reports table
CREATE TABLE IF NOT EXISTS scout_reports (
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
  owner_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_scout_reports_status CHECK (status IN ('Pending', 'Completed', 'Critical')),
  CONSTRAINT chk_scout_reports_week CHECK (implementation_week IS NULL OR implementation_week BETWEEN 1 AND 53),
  CONSTRAINT chk_scout_reports_year CHECK (implementation_year IS NULL OR implementation_year BETWEEN 2000 AND 2100),
  CONSTRAINT chk_scout_reports_temperature CHECK (temperature IS NULL OR temperature BETWEEN -50 AND 70),
  CONSTRAINT chk_scout_reports_humidity CHECK (humidity IS NULL OR humidity BETWEEN 0 AND 100)
);

-- Pest observations table
CREATE TABLE IF NOT EXISTS pest_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  pest_type VARCHAR(255) NOT NULL,
  count INTEGER DEFAULT 0,
  severity VARCHAR(50) NOT NULL,
  affected_percent DECIMAL(5, 2) DEFAULT 0,
  location_on_plant VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pest_observations_count CHECK (count >= 0),
  CONSTRAINT chk_pest_observations_severity CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_pest_observations_affected CHECK (affected_percent BETWEEN 0 AND 100)
);

-- Disease observations table
CREATE TABLE IF NOT EXISTS disease_observations (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  disease_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  affected_percent DECIMAL(5, 2) DEFAULT 0,
  spot_count INTEGER DEFAULT 0,
  spot_color VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_disease_observations_severity CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_disease_observations_affected CHECK (affected_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_disease_observations_spot_count CHECK (spot_count >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scout_reports_farm_id ON scout_reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_scout_reports_status ON scout_reports(status);
CREATE INDEX IF NOT EXISTS idx_scout_reports_owner_id ON scout_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_scout_reports_report_date ON scout_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_scout_reports_created_at_id ON scout_reports(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_scout_reports_farm_status_date ON scout_reports(farm_id, status, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_pest_observations_report_id ON pest_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_disease_observations_report_id ON disease_observations(report_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(id, user_id, expires_at) WHERE revoked_at IS NULL;

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
