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
    subjects         TEXT NOT NULL DEFAULT '[]',  -- JSON array e.g. ["Math","Physics"]
    experience_years INTEGER NOT NULL DEFAULT 0,
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
--   ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0;
