-- Migration 003: Add pricing fields to jobs table
--
-- Part of Sprint 5 pricing model.
-- Customer posts a budget range (budget_min, budget_max).
-- Worker may accept at budget_max (agreed_price = budget_max set on accept)
-- or propose a counter price (worker_counter).
-- Customer confirms counter via POST /jobs/:id/confirm-price which locks agreed_price.
--
-- All columns are nullable — no backfill required for existing rows.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS budget_min     INT,
  ADD COLUMN IF NOT EXISTS budget_max     INT,
  ADD COLUMN IF NOT EXISTS agreed_price   INT,
  ADD COLUMN IF NOT EXISTS worker_counter INT;
