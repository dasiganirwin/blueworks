-- Migration 001: Fix chk_worker_on_accept constraint
--
-- Problem: Cancelling a 'pending' job (worker_id IS NULL) violated the constraint
--   CHECK (status = 'pending' OR worker_id IS NOT NULL)
-- because the new status 'cancelled' is not 'pending' yet worker_id is still NULL.
--
-- Fix: Extend the allowlist to include 'cancelled' so a job can be cancelled
-- before any worker is assigned.

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_worker_on_accept;

ALTER TABLE jobs
  ADD CONSTRAINT chk_worker_on_accept
  CHECK (status IN ('pending', 'cancelled') OR worker_id IS NOT NULL);
