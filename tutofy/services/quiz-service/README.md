# quiz-service

Auto-graded multiple-choice quiz system. Tutors create quizzes with questions and options; enrolled students attempt them and receive instant scores.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreateQuiz` | Tutor / admin | Create a quiz for a course |
| `AddQuestion` | Tutor / admin | Add a question to a quiz |
| `AddOption` | Tutor / admin | Add an answer option (mark correct with is_correct) |
| `DeleteQuiz` | Tutor / admin | Delete a quiz and all its questions |
| `GetCourseQuizzes` | Any | List all quizzes for a course |
| `StartAttempt` | Student | Begin a new attempt (must be enrolled) |
| `SubmitAttempt` | Student (owner) | Submit answers — auto-graded immediately |
| `GetAttemptResult` | Student (own) / tutor / admin | View score and per-question breakdown |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50064` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |
| `COURSE_SERVICE_ADDR` | `localhost:50053` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/quizzes?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up quiz-service
```
