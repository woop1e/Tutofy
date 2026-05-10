CREATE TABLE IF NOT EXISTS reviews (
    id         TEXT PRIMARY KEY,
    course_id  TEXT NOT NULL,
    student_id TEXT NOT NULL,
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body       TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews (course_id);
