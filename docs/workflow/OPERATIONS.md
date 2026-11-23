# Workflow Operations Runbook

## 1. Apply the database migration

```bash
npm run migrate
```

This updates the users role constraint, creates the workflow tables/indexes, and backfills existing reports as `draft` owned by their current `owner_id` where available.

## 2. Create/assign workflow users

Public registration creates `scout` accounts. Elevated roles must be assigned by an administrator through the administrative user-management process or controlled SQL during initial rollout.

Example role assignment:

```sql
UPDATE users
SET role = 'inter_farm_supervisor', updated_at = CURRENT_TIMESTAMP
WHERE email = 'supervisor@example.com';

UPDATE users
SET role = 'head_of_department', updated_at = CURRENT_TIMESTAMP
WHERE email = 'hod@example.com';
```

Never store passwords in source control or documentation.

## 3. Test the workflow

1. Log in as a scout.
2. Create a report.
3. Select an Inter-Farm Supervisor and Share.
4. Log in as that supervisor.
5. Verify/Approve or Return.
6. After approval, share to a Head of Department.
7. Log in as the HOD and verify/return.
8. After HOD approval, share to an administrator.
9. Log in as admin and Final Verify & Approve or Return to HOD.
10. Inspect the workflow history for the report.

## 4. Security checks

- Attempt direct scout → HOD share: must return `409`.
- Attempt supervisor → HOD share before verification: must return `409`.
- Attempt HOD → admin share before verification: must return `409`.
- Attempt admin final verification before HOD share: must return `409`.
- Attempt another user to act on a report not assigned to them: must return `403` or `409`.

## 5. Assign roles through the application

Administrators can use `/admin-users` to assign `scout`, `inter_farm_supervisor`, `head_of_department` and `admin` roles. The API is protected by administrator-only authorization.
