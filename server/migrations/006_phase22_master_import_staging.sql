-- Phase 22 Master Spreadsheet Import. Extends import provenance from migration 004.
BEGIN;
ALTER TABLE report_import_batches ADD COLUMN IF NOT EXISTS source_sheet VARCHAR(255), ADD COLUMN IF NOT EXISTS mapping_hash CHAR(64);
ALTER TABLE report_import_rows ADD COLUMN IF NOT EXISTS normalized_payload JSONB, ADD COLUMN IF NOT EXISTS validation_errors JSONB, ADD COLUMN IF NOT EXISTS row_status VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_master_import_batch_hash ON report_import_batches(file_sha256);
CREATE INDEX IF NOT EXISTS idx_master_import_rows_status ON report_import_rows(batch_id,row_status);
COMMIT;
