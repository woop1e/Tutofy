CREATE TABLE IF NOT EXISTS payments (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    course_id  TEXT NOT NULL,
    amount     NUMERIC(10, 2) NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON payments (course_id);

-- Migration (run if table already exists):
-- ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
