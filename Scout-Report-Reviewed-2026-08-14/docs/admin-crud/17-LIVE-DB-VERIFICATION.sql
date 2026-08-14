-- Scout Report — Phase 1 Live PostgreSQL Verification
-- Run this against the actual scout_report database before Phase 2 CRUD.

-- 1. Required reference tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'farms', 'crop_types', 'crop_varieties',
    'pests', 'diseases', 'scout_reports',
    'pest_observations', 'disease_observations'
  )
ORDER BY table_name;

-- 2. Reference row counts
SELECT 'farms' AS table_name, COUNT(*) AS rows FROM farms
UNION ALL SELECT 'crop_types', COUNT(*) FROM crop_types
UNION ALL SELECT 'crop_varieties', COUNT(*) FROM crop_varieties
UNION ALL SELECT 'pests', COUNT(*) FROM pests
UNION ALL SELECT 'diseases', COUNT(*) FROM diseases
ORDER BY table_name;

-- 3. Foreign-key relationships affecting CRUD
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'scout_reports', 'crop_varieties',
    'pest_observations', 'disease_observations'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 4. Unique constraints affecting CRUD
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('farms', 'crop_types', 'crop_varieties', 'pests', 'diseases')
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 5. Confirm historical observation fields are text-based reference values
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'pest_observations' AND column_name = 'pest_type')
    OR (table_name = 'disease_observations' AND column_name = 'disease_type'))
ORDER BY table_name;
