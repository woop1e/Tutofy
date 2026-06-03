#!/bin/bash
set -e

DB_URL="${DATABASE_URL}"  # Render's managed PostgreSQL URL

# ── 1. Init all databases ─────────────────────────────────────────────────────
echo "=== Creating databases ==="
# Extract connection parts from DATABASE_URL
# Format: postgres://user:pass@host:port/dbname
BASE_URL=$(echo "$DB_URL" | sed 's|/[^/]*$||')  # strip db name

for db in auth users courses enrollments lessons assignments grading \
           notifications progress media messaging payments submissions \
           quizzes reviews certificates; do
  echo "  Creating $db..."
  psql "${BASE_URL}/postgres" -c "CREATE DATABASE $db;" 2>/dev/null || true
done
echo "=== Databases ready ==="

# ── 2. Create MinIO bucket ────────────────────────────────────────────────────
mkdir -p /data/minio
echo "=== MinIO will auto-create bucket on first use ==="

# ── 3. Export env vars for all services ──────────────────────────────────────
# Parse DATABASE_URL → per-service URLs
DB_USER=$(echo "$DB_URL" | sed 's|postgres://\([^:]*\):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed 's|postgres://[^:]*:\([^@]*\)@.*|\1|')
DB_HOST=$(echo "$DB_URL" | sed 's|.*@\([^:/]*\).*|\1|')
DB_PORT=$(echo "$DB_URL" | sed 's|.*:\([0-9]*\)/.*|\1|')

export AUTH_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/auth?sslmode=require"
export USER_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/users?sslmode=require"
export COURSE_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/courses?sslmode=require"
export ENROLLMENT_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/enrollments?sslmode=require"
export LESSON_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/lessons?sslmode=require"
export ASSIGNMENT_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/assignments?sslmode=require"
export GRADING_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/grading?sslmode=require"
export NOTIFICATION_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/notifications?sslmode=require"
export PROGRESS_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/progress?sslmode=require"
export MEDIA_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/media?sslmode=require"
export MESSAGING_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/messaging?sslmode=require"
export PAYMENT_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/payments?sslmode=require"
export SUBMISSION_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/submissions?sslmode=require"
export QUIZ_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/quizzes?sslmode=require"
export REVIEW_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/reviews?sslmode=require"
export CERT_DB_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/certificates?sslmode=require"

MINIO_USER="${MINIO_USER:-minioadmin}"
MINIO_PASS="${MINIO_PASS:-minioadmin123}"
export MINIO_USER MINIO_PASS

echo "=== Starting all services via supervisord ==="
exec /usr/bin/supervisord -c /etc/supervisord.conf
