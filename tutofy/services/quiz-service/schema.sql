CREATE TABLE IF NOT EXISTS quizzes (
    id         TEXT PRIMARY KEY,
    course_id  TEXT NOT NULL,
    title      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id       TEXT PRIMARY KEY,
    quiz_id  TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text     TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS options (
    id          TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           TEXT PRIMARY KEY,
    quiz_id      TEXT NOT NULL,
    student_id   TEXT NOT NULL,
    score        INTEGER NOT NULL DEFAULT 0,
    total        INTEGER NOT NULL DEFAULT 0,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attempt_answers (
    attempt_id  TEXT NOT NULL,
    question_id TEXT NOT NULL,
    option_id   TEXT NOT NULL,
    PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON options (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts (student_id, quiz_id);
