-- Analytics/report dashboard indexes
CREATE INDEX IF NOT EXISTS idx_scout_reports_crop_date ON scout_reports(crop_type, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_scout_reports_farm_date ON scout_reports(farm_name, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_scout_reports_status_date ON scout_reports(status, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
