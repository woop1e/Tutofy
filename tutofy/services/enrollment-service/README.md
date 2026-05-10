# enrollment-service

Manages course enrollments — enroll, unenroll, and query enrollment status.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `EnrollUser` | Student | Enroll caller in a course |
| `UnenrollUser` | Student (self) / admin | Drop an enrollment |
| `GetUserEnrollments` | Student (own) / tutor / admin | List enrollments for a user |
| `GetCourseEnrollments` | Tutor / admin | List all students in a course |

Duplicate enrollments and non-existent courses are rejected.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50054` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `COURSE_SERVICE_ADDR` | `localhost:50053` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/enrollments?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up enrollment-service
```
