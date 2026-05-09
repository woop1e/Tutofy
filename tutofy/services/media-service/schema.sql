-- migrations/001_create_media_files_table.sql

CREATE TABLE IF NOT EXISTS media_files (
    id          TEXT        PRIMARY KEY,
    course_id   TEXT        NOT NULL,
    uploader_id TEXT        NOT NULL,
    file_name   TEXT        NOT NULL,
    s3_key      TEXT        NOT NULL UNIQUE,
    file_type   SMALLINT    NOT NULL,  -- 1=assignment, 2=course_material
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_files_course_id
    ON media_files (course_id);

CREATE INDEX IF NOT EXISTS idx_media_files_uploader_id
    ON media_files (uploader_id);