-- migrations/001_create_lessons_table.sql

CREATE TABLE IF NOT EXISTS lessons (
    id               TEXT        PRIMARY KEY,
    course_id        TEXT        NOT NULL,
    tutor_id         TEXT        NOT NULL,
    title            TEXT        NOT NULL,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER     NOT NULL,
    video_link       TEXT        NOT NULL DEFAULT '',
    status           SMALLINT    NOT NULL DEFAULT 1,  -- 1=planned, 2=completed, 3=cancelled
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id
    ON lessons (course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id
    ON lessons (tutor_id);

CREATE TABLE IF NOT EXISTS lesson_attendance (
    lesson_id  TEXT    NOT NULL,
    student_id TEXT    NOT NULL,
    attended   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (lesson_id, student_id)
);

-- Migration: run if table does not exist
-- CREATE TABLE lesson_attendance (lesson_id TEXT NOT NULL, student_id TEXT NOT NULL, attended BOOLEAN NOT NULL DEFAULT FALSE, PRIMARY KEY (lesson_id, student_id));

CREATE TABLE IF NOT EXISTS lesson_materials (
    id           TEXT PRIMARY KEY,
    lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    file_id      TEXT NOT NULL,
    title        TEXT NOT NULL DEFAULT '',
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON lesson_materials (lesson_id);