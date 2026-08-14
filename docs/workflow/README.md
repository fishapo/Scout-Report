# Scout Report — Multi-Stage Verification Workflow

## Business process

```text
FIELD SCOUT
   │ create
   ▼
DRAFT
   │ share
   ▼
INTER-FARM SUPERVISOR
   │ verify
   ├──────── reject ───────► SCOUT CORRECTION
   │
   └──────── approve
             ▼
SUPERVISOR VERIFIED
   │ share
   ▼
HEAD OF DEPARTMENT
   │ verify
   ├──────── reject ───────► SUPERVISOR CORRECTION
   │
   └──────── approve
             ▼
HOD VERIFIED
   │ share
   ▼
ADMINISTRATOR
   │ final verify
   ├──────── reject ───────► HOD CORRECTION
   │
   └──────── approve
             ▼
          APPROVED
```

## Non-negotiable rules

1. A scout cannot share directly to the HOD or administrator.
2. An Inter-Farm Supervisor cannot forward a report until the supervisor verification succeeds.
3. A Head of Department cannot forward a report until HOD verification succeeds.
4. An administrator can only final-verify reports that have reached `awaiting_admin`.
5. A rejection returns the report to the immediately previous operational stage.
6. Every share, verification and return creates an immutable workflow event.
7. The current holder is explicit, so reports are assigned to a real user at every hand-off.
8. Existing report/reference functionality remains separate from workflow authorization.

## Roles

| Role | Create | Verify | Share | Final approval |
|---|---|---|---|---|
| Field Scout | Yes | No | To Inter-Farm Supervisor | No |
| Inter-Farm Supervisor | No | Scout submissions | To HOD after verification | No |
| Head of Department | No | Supervisor submissions | To Admin after verification | No |
| Administrator | Existing admin functions | Final stage | No | Yes |

## Audit model

`report_workflows` stores the current workflow state and current holder.
`report_workflow_events` stores the complete event trail: actor, role, action, source stage, destination stage, recipient, comment and timestamp.

The workflow state is intentionally separate from the existing report `status` (`Pending`, `Completed`, `Critical`). Report severity and organizational verification are different concepts and should not overwrite one another.
