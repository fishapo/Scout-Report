BEGIN;

ALTER TABLE scout_reports
  ADD COLUMN IF NOT EXISTS canonical_payload JSONB;

ALTER TABLE report_import_rows
  ADD COLUMN IF NOT EXISTS canonical_payload JSONB,
  ADD COLUMN IF NOT EXISTS committed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS commit_error TEXT;

ALTER TABLE report_import_batches
  ADD COLUMN IF NOT EXISTS committed_rows INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS committed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_import_rows_canonical_report
  ON report_import_rows(canonical_report_id);

COMMIT;
