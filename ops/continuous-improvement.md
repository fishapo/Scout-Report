# Scout Report — Continuous Improvement Standard

Phase 16 establishes an evidence-driven operating cadence without inventing production measurements.

## Cadence
- Daily: health, 5xx, authentication throttling and backup freshness review.
- Weekly: 7-day SLO review, incident/action register review and deployment review.
- Monthly: 30-day reliability review, backup/restore evidence review and roadmap reprioritization.
- After every incident: capture request IDs, root cause, corrective action, owner and due date.

## Decision rules
1. Preserve the Scout-facing `/api/reference/*` contract.
2. Prefer measured reliability fixes before speculative feature work when SLOs regress.
3. Do not treat missing evidence as a pass.
4. Do not invent SLO measurements; generate reports only from supplied evidence.
5. Retain release checksums and rollback evidence for every production release.
