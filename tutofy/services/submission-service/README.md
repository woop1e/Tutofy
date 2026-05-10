# submission-service

Tracks student assignment submissions before grading. Students submit work (text or a file reference), tutors retrieve and grade it.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `SubmitAssignment` | Student | Submit work for an assignment (content or file_id required) |
| `GetSubmission` | Student (own) / tutor / admin | Get a single submission by assignment + student |
| `GetAssignmentSubmissions` | Tutor / admin | List all submissions for an assignment (limit, offset) |
| `MarkGraded` | Tutor / admin | Transition submission status → graded |

Status values: `submitted`, `late`, `graded`.
Validates that the assignment exists and the student is enrolled before accepting a submission.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50063` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `ASSIGNMENT_SERVICE_ADDR` | `localhost:50059` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/submissions?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up submission-service
```
