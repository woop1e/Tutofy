# grading-service

Records and retrieves grades for student assignment submissions.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `SubmitGrade` | Tutor / admin | Submit or update a grade (0–100) with optional feedback |
| `GetStudentGrades` | Student (own) / tutor / admin | All grades for a student |
| `GetAssignmentGrades` | Tutor / admin | All grades for an assignment |

Validates that the assignment exists and the student is enrolled before saving. Notifies the student via notification-service after grading.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50056` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `ASSIGNMENT_SERVICE_ADDR` | `localhost:50059` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |
| `NOTIFICATION_SERVICE_ADDR` | `localhost:50057` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/grading?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up grading-service
```
