-- Migration 002: Create ratings table
--
-- Allows customers and workers to rate each other after a job is completed.
-- Enforces one rating per party per job via unique constraint.
-- Automatically updates the worker's average rating on insert.

-- ── Create ratings table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Prevent double rating: one rating per rater per job ───────────────────────
ALTER TABLE ratings
  ADD CONSTRAINT uq_rating_per_job_rater UNIQUE (job_id, rater_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read ratings (for worker profiles)
CREATE POLICY "ratings_select" ON ratings
  FOR SELECT TO authenticated USING (true);

-- Only the rater can insert their own rating
CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());

-- ── Trigger: update worker average rating after each new rating ───────────────
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workers
  SET rating = (
    SELECT ROUND(AVG(r.rating)::numeric, 2)
    FROM ratings r
    JOIN jobs j ON j.id = r.job_id
    WHERE j.worker_id = workers.user_id
      AND r.ratee_id  = workers.user_id
  )
  WHERE user_id = NEW.ratee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_worker_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating();
