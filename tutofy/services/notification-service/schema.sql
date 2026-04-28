-- migrations/001_create_notifications_table.sql

CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT        PRIMARY KEY,
    user_id    TEXT        NOT NULL,
    type       SMALLINT    NOT NULL,  -- 1=grade
    message    TEXT        NOT NULL,
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications (user_id);

-- Speeds up the common query: unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read)
    WHERE is_read = FALSE;