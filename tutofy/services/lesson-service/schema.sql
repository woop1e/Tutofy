-- migrations/001_create_lessons_table.sql

CREATE TABLE IF NOT EXISTS lessons (
    id               TEXT        PRIMARY KEY,
    course_id        TEXT        NOT NULL,
    tutor_id         TEXT        NOT NULL,
    title            TEXT        NOT NULL,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER     NOT NULL,
    video_link       TEXT        NOT NULL DEFAULT '',
    status           SMALLINT    NOT NULL DEFAULT 1  -- 1=planned, 2=completed, 3=cancelled
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id
    ON lessons (course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id
    ON lessons (tutor_id);