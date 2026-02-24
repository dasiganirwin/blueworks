-- =============================================================
-- BlueWork Database Schema
-- PostgreSQL 15+
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM (
    'customer',
    'worker',
    'admin'
);

CREATE TYPE user_status AS ENUM (
    'pending_verification',  -- registered, OTP not yet confirmed
    'pending_approval',      -- worker verified phone, awaiting admin approval
    'active',
    'suspended',
    'deleted'
);

CREATE TYPE worker_availability AS ENUM (
    'online',
    'offline',
    'busy'   -- on an active job; set automatically
);

CREATE TYPE job_urgency AS ENUM (
    'immediate',
    'scheduled'
);

-- State machine: pending → accepted → en_route → in_progress → completed
--                       ↘ cancelled (from pending or accepted only)
--                                                 ↘ disputed (from in_progress or completed)
CREATE TYPE job_status AS ENUM (
    'pending',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
    'disputed'
);

CREATE TYPE payment_method AS ENUM (
    'card',
    'gcash',
    'maya',
    'cash'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE dispute_status AS ENUM (
    'open',
    'under_review',
    'resolved'
);

CREATE TYPE dispute_action AS ENUM (
    'full_refund',
    'partial_refund',
    'no_action',
    'worker_warning'
);

CREATE TYPE notification_type AS ENUM (
    'job_created',
    'job_accepted',
    'job_en_route',
    'job_started',
    'job_completed',
    'job_cancelled',
    'payment_confirmed',
    'dispute_opened',
    'dispute_resolved',
    'worker_approved',
    'worker_suspended'
);

CREATE TYPE device_platform AS ENUM (
    'ios',
    'android'
);

-- =============================================================
-- USERS (base table for all roles)
-- =============================================================

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    role            user_role       NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    UNIQUE,
    phone           VARCHAR(20)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    status          user_status     NOT NULL DEFAULT 'pending_verification',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                             -- soft delete
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_phone   ON users(phone);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_status  ON users(status);

-- =============================================================
-- CUSTOMERS (extends users)
-- =============================================================

CREATE TABLE customers (
    user_id             UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_address     TEXT,
    default_lat         DECIMAL(9, 6),
    default_lng         DECIMAL(9, 6)
);

-- =============================================================
-- WORKERS (extends users)
-- =============================================================

CREATE TABLE workers (
    user_id                 UUID                    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    availability_status     worker_availability     NOT NULL DEFAULT 'offline',
    current_lat             DECIMAL(9, 6),
    current_lng             DECIMAL(9, 6),
    location_updated_at     TIMESTAMPTZ,
    rating                  DECIMAL(3, 2)           NOT NULL DEFAULT 0.00
                                CHECK (rating >= 0.00 AND rating <= 5.00),
    completed_jobs_count    INTEGER                 NOT NULL DEFAULT 0,
    approved_at             TIMESTAMPTZ,
    approved_by             UUID                    REFERENCES users(id)    -- admin who approved
);

CREATE INDEX idx_workers_availability   ON workers(availability_status);
CREATE INDEX idx_workers_location       ON workers(current_lat, current_lng);

-- =============================================================
-- WORKER SKILLS (many skills per worker)
-- =============================================================

CREATE TABLE worker_skills (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id   UUID            NOT NULL REFERENCES workers(user_id) ON DELETE CASCADE,
    category    VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (worker_id, category)
);

CREATE INDEX idx_worker_skills_worker   ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_category ON worker_skills(category);

-- =============================================================
-- JOB CATEGORIES
-- =============================================================

CREATE TABLE job_categories (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(50)     NOT NULL UNIQUE,    -- e.g. 'plumber', 'electrician'
    label       VARCHAR(100)    NOT NULL,            -- e.g. 'Plumber', 'Electrician'
    icon_url    TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
);

-- =============================================================
-- JOBS
-- =============================================================

CREATE TABLE jobs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID            NOT NULL REFERENCES users(id),
    worker_id           UUID            REFERENCES users(id),               -- null until accepted
    category            VARCHAR(50)     NOT NULL,
    description         TEXT            NOT NULL,

    -- Location snapshot at time of job creation
    location_address    TEXT            NOT NULL,
    location_lat        DECIMAL(9, 6)   NOT NULL,
    location_lng        DECIMAL(9, 6)   NOT NULL,

    urgency             job_urgency     NOT NULL DEFAULT 'immediate',
    scheduled_at        TIMESTAMPTZ,                                        -- required if urgency = scheduled
    status              job_status      NOT NULL DEFAULT 'pending',

    -- Cancellation
    cancellation_reason TEXT,
    cancelled_by        UUID            REFERENCES users(id),

    -- Timestamps per state transition
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    accepted_at         TIMESTAMPTZ,
    en_route_at         TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT chk_scheduled_at CHECK (
        urgency = 'immediate' OR scheduled_at IS NOT NULL
    ),
    CONSTRAINT chk_worker_on_accept CHECK (
        status = 'pending' OR worker_id IS NOT NULL
    )
);

CREATE INDEX idx_jobs_customer      ON jobs(customer_id);
CREATE INDEX idx_jobs_worker        ON jobs(worker_id);
CREATE INDEX idx_jobs_status        ON jobs(status);
CREATE INDEX idx_jobs_category      ON jobs(category);
CREATE INDEX idx_jobs_location      ON jobs(location_lat, location_lng);
CREATE INDEX idx_jobs_created_at    ON jobs(created_at DESC);
CREATE INDEX idx_jobs_scheduled_at  ON jobs(scheduled_at) WHERE urgency = 'scheduled';

-- =============================================================
-- JOB PHOTOS
-- =============================================================

CREATE TABLE job_photos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    url             TEXT        NOT NULL,
    uploaded_by     UUID        NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_photos_job ON job_photos(job_id);

-- =============================================================
-- JOB STATUS HISTORY (full audit trail of every transition)
-- =============================================================

CREATE TABLE job_status_history (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    from_status     job_status,                             -- null for initial 'pending'
    to_status       job_status  NOT NULL,
    changed_by      UUID        NOT NULL REFERENCES users(id),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_status_history_job ON job_status_history(job_id);

-- =============================================================
-- PAYMENTS
-- =============================================================

CREATE TABLE payments (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                  UUID            NOT NULL UNIQUE REFERENCES jobs(id),
    customer_id             UUID            NOT NULL REFERENCES users(id),
    worker_id               UUID            NOT NULL REFERENCES users(id),
    method                  payment_method  NOT NULL,
    amount                  DECIMAL(10, 2)  NOT NULL CHECK (amount > 0),
    currency                CHAR(3)         NOT NULL DEFAULT 'PHP',
    status                  payment_status  NOT NULL DEFAULT 'pending',
    gateway_transaction_id  VARCHAR(255),               -- from Stripe / PayPal
    payment_url             TEXT,                       -- checkout URL; null for cash
    cash_confirmed_at       TIMESTAMPTZ,                -- worker confirms cash received
    expires_at              TIMESTAMPTZ,                -- payment session expiry
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_job           ON payments(job_id);
CREATE INDEX idx_payments_customer      ON payments(customer_id);
CREATE INDEX idx_payments_worker        ON payments(worker_id);
CREATE INDEX idx_payments_status        ON payments(status);
CREATE INDEX idx_payments_gateway_tx    ON payments(gateway_transaction_id)
    WHERE gateway_transaction_id IS NOT NULL;

-- =============================================================
-- REFUNDS
-- =============================================================

CREATE TABLE refunds (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID            NOT NULL REFERENCES payments(id),
    amount              DECIMAL(10, 2)  NOT NULL CHECK (amount > 0),
    reason              TEXT            NOT NULL,
    issued_by           UUID            NOT NULL REFERENCES users(id),  -- admin
    gateway_refund_id   VARCHAR(255),
    status              VARCHAR(50)     NOT NULL DEFAULT 'processing',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);

-- =============================================================
-- DISPUTES
-- =============================================================

CREATE TABLE disputes (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID                NOT NULL UNIQUE REFERENCES jobs(id),
    raised_by       UUID                NOT NULL REFERENCES users(id),
    reason          TEXT                NOT NULL,
    status          dispute_status      NOT NULL DEFAULT 'open',
    resolution      TEXT,               -- admin's written resolution
    action          dispute_action,     -- what action admin took
    resolved_by     UUID                REFERENCES users(id),
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_disputes_job    ON disputes(job_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- =============================================================
-- DISPUTE PHOTOS (evidence submitted by either party)
-- =============================================================

CREATE TABLE dispute_photos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id      UUID        NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    url             TEXT        NOT NULL,
    uploaded_by     UUID        NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispute_photos_dispute ON dispute_photos(dispute_id);

-- =============================================================
-- MESSAGES (in-job chat)
-- =============================================================

CREATE TABLE messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id   UUID        NOT NULL REFERENCES users(id),
    content     TEXT        NOT NULL CHECK (LENGTH(content) > 0),
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_job       ON messages(job_id);
CREATE INDEX idx_messages_job_time  ON messages(job_id, sent_at DESC);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

CREATE TABLE notifications (
    id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type   NOT NULL,
    title       VARCHAR(255)        NOT NULL,
    body        TEXT                NOT NULL,
    payload     JSONB,              -- e.g. { "job_id": "..." } for deep-linking
    read        BOOLEAN             NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user         ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread  ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at   ON notifications(created_at DESC);

-- =============================================================
-- OTP CODES
-- =============================================================

CREATE TABLE otp_codes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       VARCHAR(20) NOT NULL,
    code_hash   VARCHAR(255) NOT NULL,          -- store hash, never plaintext
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone      ON otp_codes(phone);
CREATE INDEX idx_otp_expires    ON otp_codes(expires_at);

-- =============================================================
-- PASSWORD RESET TOKENS
-- =============================================================

CREATE TABLE password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,   -- hash of the emailed token
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token  ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_user   ON password_reset_tokens(user_id);

-- =============================================================
-- REFRESH TOKENS
-- =============================================================

CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- =============================================================
-- WORKER LOCATION LOGS (GPS history during active jobs)
-- =============================================================

CREATE TABLE worker_location_logs (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id   UUID            NOT NULL REFERENCES workers(user_id) ON DELETE CASCADE,
    job_id      UUID            REFERENCES jobs(id),    -- null if not on a job
    lat         DECIMAL(9, 6)   NOT NULL,
    lng         DECIMAL(9, 6)   NOT NULL,
    recorded_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_loc_worker      ON worker_location_logs(worker_id);
CREATE INDEX idx_worker_loc_job         ON worker_location_logs(job_id);
CREATE INDEX idx_worker_loc_recorded    ON worker_location_logs(recorded_at DESC);

-- Partition or purge rows older than 30 days via a scheduled job

-- =============================================================
-- DEVICE TOKENS (for push notifications via FCM / APNs)
-- =============================================================

CREATE TABLE device_tokens (
    id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT                NOT NULL,
    platform    device_platform     NOT NULL,
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- =============================================================
-- AUDIT LOGS (admin action trail)
-- =============================================================

CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID        NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,          -- e.g. 'worker.approved', 'dispute.resolved'
    target_type VARCHAR(50) NOT NULL,           -- 'user', 'job', 'dispute', 'payment'
    target_id   UUID        NOT NULL,
    metadata    JSONB,                          -- before/after snapshot or extra context
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor       ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target      ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at DESC);

-- =============================================================
-- UPDATED_AT TRIGGER (auto-update on every row change)
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- SEED: Job Categories
-- =============================================================

INSERT INTO job_categories (slug, label, icon_url) VALUES
    ('plumber',       'Plumber',        NULL),
    ('electrician',   'Electrician',    NULL),
    ('carpenter',     'Carpenter',      NULL),
    ('welder',        'Welder',         NULL),
    ('painter',       'Painter',        NULL),
    ('aircon-tech',   'Aircon Tech',    NULL),
    ('mason',         'Mason',          NULL),
    ('general',       'General Labor',  NULL);
