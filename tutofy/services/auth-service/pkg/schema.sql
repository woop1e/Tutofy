-- Run this before starting the service
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    email    TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name     TEXT NOT NULL DEFAULT '',
    role     TEXT NOT NULL
);
