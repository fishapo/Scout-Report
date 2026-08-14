-- Phase 22: structured verification checklist per report/review gate.
BEGIN;

CREATE TABLE IF NOT EXISTS report_verification_checklists (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  item_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  comment TEXT,
  completed_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, stage, item_key)
);

CREATE INDEX IF NOT EXISTS idx_report_checklist_report_stage
  ON report_verification_checklists(report_id, stage);

COMMIT;
