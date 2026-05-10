CREATE TABLE IF NOT EXISTS grades (
    id            TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id    TEXT NOT NULL,
    grade         REAL NOT NULL,
    feedback      TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);

-- Migration (run if table already exists):
-- ALTER TABLE grades ADD COLUMN IF NOT EXISTS feedback TEXT NOT NULL DEFAULT '';
-- ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
