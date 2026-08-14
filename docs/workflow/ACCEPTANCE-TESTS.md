# Workflow Acceptance Tests

## Happy path

- Scout creates report → `draft`.
- Scout shares → `awaiting_supervisor`.
- Supervisor approves → `supervisor_verified`.
- Supervisor shares → `awaiting_hod`.
- HOD approves → `hod_verified`.
- HOD shares → `awaiting_admin`.
- Admin approves → `approved`.

## Rejection path

- Supervisor rejects → `returned_to_scout` and scout becomes holder.
- HOD rejects → `returned_to_supervisor` and supervisor becomes holder.
- Admin rejects → `returned_to_hod` and HOD becomes holder.

## Security path

- Scout cannot share directly to HOD or Admin.
- Supervisor cannot share before verification.
- HOD cannot share before verification.
- Admin cannot final-verify before HOD has verified and shared.
- A user who is not the current holder cannot verify or share.
- Elevated roles cannot be self-assigned through public registration.
- Only an administrator can assign workflow roles.
