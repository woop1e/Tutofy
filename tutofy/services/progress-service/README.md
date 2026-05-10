# progress-service

Tracks per-student lesson progress within courses. Updated automatically by lesson-service when lesson statuses change.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `RecordLessonEvent` | Internal (lesson-service) | Record a lesson status change for a student |
| `GetProgress` | Student (own) / tutor / parent / admin | Get a student's progress in a course |
| `GetCourseProgress` | Tutor / parent / admin | Progress for all students in a course (limit, offset) |

Progress includes planned, completed, and cancelled lesson counts plus a completion percentage.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50058` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/progress?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up progress-service
```
