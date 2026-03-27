CREATE TABLE IF NOT EXISTS grades (
    id            TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id    TEXT NOT NULL,
    grade         REAL NOT NULL,
    UNIQUE (assignment_id, student_id)
);
