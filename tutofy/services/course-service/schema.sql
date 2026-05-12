CREATE TABLE IF NOT EXISTS courses (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    tutor_id            TEXT NOT NULL,
    price               NUMERIC(10, 2) NOT NULL DEFAULT 0,
    course_type         TEXT NOT NULL DEFAULT 'group',
    max_students        INTEGER NOT NULL DEFAULT 0,
    enrollment_deadline TIMESTAMPTZ,
    is_published        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_courses_tutor ON courses (tutor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published) WHERE is_published = TRUE;

-- Migration (run if table already exists):
-- ALTER TABLE courses
--   ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'group',
--   ADD COLUMN IF NOT EXISTS max_students INTEGER NOT NULL DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS enrollment_deadline TIMESTAMPTZ,
--   ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS course_tags (
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_course_tags_tag ON course_tags (tag_id);
