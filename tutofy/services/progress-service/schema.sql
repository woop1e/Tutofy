-- migrations/001_create_progress_tables.sql

-- Stores the last known status of each lesson for a given student.
-- This is needed so that when a status changes (e.g. planned → completed),
-- the repository can subtract from the old bucket and add to the new one.
CREATE TABLE IF NOT EXISTS lesson_events (
    lesson_id  TEXT     NOT NULL,
    student_id TEXT     NOT NULL,
    course_id  TEXT     NOT NULL,
    status     SMALLINT NOT NULL,  -- 1=planned, 2=completed, 3=cancelled
    PRIMARY KEY (lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_events_student_course
    ON lesson_events (student_id, course_id);

-- Stores pre-aggregated counters per (student, course) pair for fast reads.
CREATE TABLE IF NOT EXISTS progress (
    student_id         TEXT    NOT NULL,
    course_id          TEXT    NOT NULL,
    completed_lessons  INTEGER NOT NULL DEFAULT 0,
    cancelled_lessons  INTEGER NOT NULL DEFAULT 0,
    planned_lessons    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_course_id
    ON progress (course_id);