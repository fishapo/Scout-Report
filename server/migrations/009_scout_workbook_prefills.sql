CREATE TABLE IF NOT EXISTS scout_workbook_prefills (
  scout_user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  import_row_id VARCHAR(50) NOT NULL REFERENCES report_import_rows(id) ON DELETE CASCADE
);
