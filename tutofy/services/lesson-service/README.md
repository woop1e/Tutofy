# lesson-service

Manages lesson scheduling and status within courses.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreateLesson` | Tutor / admin | Create a lesson for a course |
| `GetLesson` | Enrolled student / tutor / admin | Get lesson by ID |
| `GetCourseLessons` | Enrolled student / tutor / admin | List lessons in a course (limit, offset) |
| `UpdateLessonStatus` | Tutor-creator / admin | Move to PLANNED / COMPLETED / CANCELLED |
| `DeleteLesson` | Tutor-creator / admin | Delete a lesson |

Status changes are forwarded to progress-service for all enrolled students.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50055` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `COURSE_SERVICE_ADDR` | `localhost:50053` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |
| `PROGRESS_SERVICE_ADDR` | `localhost:50058` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/lessons?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up lesson-service
```
