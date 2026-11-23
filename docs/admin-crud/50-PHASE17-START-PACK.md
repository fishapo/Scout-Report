# Phase 17 Start Pack — Release Evidence & Local Acceptance

## Objective
Move the project from the Phase 16 source-level continuous-improvement framework to a reproducible Phase 17 acceptance baseline: clean dependency installation, PostgreSQL-backed runtime verification, release-gate progression, evidence capture, and an explicit boundary between local evidence and external deployment certification.

## Completed scope
1. Restore and verify the complete npm dependency tree.
2. Verify PostgreSQL connectivity and schema availability.
3. Run the full test suite with DB integration enabled.
4. Promote the release gate from Phase 16 to Phase 17.
5. Extend CI/release evidence wiring through Phase 17.
6. Record reproducible local evidence.
7. Preserve the stable Scout `/api/reference/*` contract.
8. Define Phase 18 as the external staging/production execution milestone.

## Non-goals
Phase 17 does not invent or simulate production SLOs, deployment approvals, rollback events, or backup/restore results.
