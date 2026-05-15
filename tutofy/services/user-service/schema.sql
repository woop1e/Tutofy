CREATE TABLE IF NOT EXISTS users (
    id               TEXT PRIMARY KEY,
    email            TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    role             TEXT NOT NULL DEFAULT 'user',
    -- tutor profile fields
    bio              TEXT NOT NULL DEFAULT '',
    age              INTEGER,
    location         TEXT NOT NULL DEFAULT '',
    photo_url        TEXT NOT NULL DEFAULT '',
    subjects         TEXT NOT NULL DEFAULT '[]',       -- JSON array e.g. ["Math","Physics"]
    experience_years INTEGER NOT NULL DEFAULT 0,
    certificates     TEXT NOT NULL DEFAULT '[]',       -- JSON array e.g. ["IELTS 8.0","Cambridge C2"]
    -- tutor extended profile
    status           TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    phone            TEXT NOT NULL DEFAULT '',
    teaching_language TEXT NOT NULL DEFAULT '',
    student_level    TEXT NOT NULL DEFAULT '',         -- beginner | intermediate | advanced | all
    lesson_type      TEXT NOT NULL DEFAULT '',         -- individual | group | both
    hourly_price     INTEGER NOT NULL DEFAULT 0,
    education        TEXT NOT NULL DEFAULT '',
    available_days   TEXT NOT NULL DEFAULT '[]',       -- JSON array e.g. ["Mon","Tue"]
    available_time_start TEXT NOT NULL DEFAULT '',
    available_time_end   TEXT NOT NULL DEFAULT '',
    timezone         TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ
);

-- Migration (run if table already exists):
-- ALTER TABLE users
--   ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS age INTEGER,
--   ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS subjects TEXT NOT NULL DEFAULT '[]',
--   ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS certificates TEXT NOT NULL DEFAULT '[]',
--   ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
--   ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS teaching_language TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS student_level TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS hourly_price INTEGER NOT NULL DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS education TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS available_days TEXT NOT NULL DEFAULT '[]',
--   ADD COLUMN IF NOT EXISTS available_time_start TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS available_time_end TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT '';
