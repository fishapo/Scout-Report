-- Scout Report multi-stage verification workflow.
-- Roles: scout -> inter_farm_supervisor -> head_of_department -> admin.

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
  CHECK (role IN ('admin', 'scout', 'inter_farm_supervisor', 'head_of_department'));

CREATE TABLE IF NOT EXISTS report_workflows (
  report_id VARCHAR(50) PRIMARY KEY REFERENCES scout_reports(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL DEFAULT 'draft',
  current_holder_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_report_workflow_stage CHECK (
    stage IN (
      'draft',
      'awaiting_supervisor',
      'supervisor_verified',
      'awaiting_hod',
      'hod_verified',
      'awaiting_admin',
      'approved',
      'returned_to_scout',
      'returned_to_supervisor',
      'returned_to_hod'
    )
  )
);

CREATE TABLE IF NOT EXISTS report_workflow_events (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL REFERENCES scout_reports(id) ON DELETE CASCADE,
  actor_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(30) NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  recipient_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_workflows_holder_stage
  ON report_workflows(current_holder_user_id, stage);
CREATE INDEX IF NOT EXISTS idx_report_workflows_stage
  ON report_workflows(stage);
CREATE INDEX IF NOT EXISTS idx_report_workflow_events_report
  ON report_workflow_events(report_id, created_at, id);

-- Backfill legacy reports without changing their existing report data.
INSERT INTO report_workflows (report_id, stage, current_holder_user_id, updated_at)
SELECT sr.id, 'draft', sr.owner_id, COALESCE(sr.updated_at, CURRENT_TIMESTAMP)
FROM scout_reports sr
LEFT JOIN report_workflows rw ON rw.report_id = sr.id
WHERE rw.report_id IS NULL;

-- Record the initial ownership event for the backfilled reports where possible.
INSERT INTO report_workflow_events
  (id, report_id, actor_user_id, actor_role, action, from_stage, to_stage, recipient_user_id, comment, created_at)
SELECT
  'wf-' || md5(sr.id || '-initial'),
  sr.id,
  sr.owner_id,
  COALESCE(owner.role, 'admin'),
  'created',
  NULL,
  'draft',
  sr.owner_id,
  'Workflow initialized for an existing report.',
  COALESCE(sr.created_at, CURRENT_TIMESTAMP)
FROM scout_reports sr
LEFT JOIN users owner ON owner.id = sr.owner_id
LEFT JOIN report_workflow_events e
  ON e.report_id = sr.id AND e.action = 'created'
WHERE e.id IS NULL;
