# Task Dispatch — Lau (Backend Developer)
**From:** Orchestrator Agent
**Date:** 2026-02-25
**Sprint:** Sprint 1 – UX Polish & Bug Fixes

---

## 🚨 CRITICAL — Start Immediately

### S1-01 · Fix Job Cancel 500 Error (DB Migration)
**Priority:** CRITICAL BLOCKER
**File:** `backend/migrations/001_fix_worker_constraint.sql`

The `chk_worker_on_accept` constraint on the `jobs` table was never applied to the live Supabase database. Cancelling a pending job (worker_id = NULL) violates the old constraint and returns 500.

**Action:**
1. Open the Supabase SQL Editor at: https://supabase.com/dashboard/project/cjqtrsfxdxtioecoapty/sql
2. Run the following SQL:

```sql
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_worker_on_accept;

ALTER TABLE jobs
  ADD CONSTRAINT chk_worker_on_accept
  CHECK (status IN ('pending', 'cancelled') OR worker_id IS NOT NULL);
```

3. Verify by testing: PATCH `/api/v1/jobs/:id/status` with `{ "status": "cancelled" }` on a pending job → should return 200.

**Definition of Done:** Cancel Job modal completes successfully with no 500 error.

---

## No other backend tasks in Sprint 1.

After S1-01 is done, coordinate with Jei for any API changes needed for:
- Earnings filters (S1-12) — may need query params on `GET /workers/me/earnings`
- Dispute detail (S1-13) — confirm existing `GET /disputes/:id` returns enough data
- Worker profile for admin (S1-14) — confirm existing `GET /workers/:id` returns skills + history

Ping @jei on Slack after S1-01 is confirmed working.
