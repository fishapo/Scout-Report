ALTER TABLE scout_reports
  ADD COLUMN IF NOT EXISTS client_submission_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS ux_scout_reports_owner_client_submission
  ON scout_reports(owner_id, client_submission_id)
  WHERE owner_id IS NOT NULL AND client_submission_id IS NOT NULL;
