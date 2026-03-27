CREATE TABLE IF NOT EXISTS enrollments (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL,
    course_id TEXT NOT NULL,
    UNIQUE (user_id, course_id)
);
