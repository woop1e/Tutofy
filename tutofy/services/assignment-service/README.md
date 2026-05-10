# assignment-service

Manages course assignments — create, retrieve, update, and delete.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreateAssignment` | Tutor / admin | Create an assignment for a course |
| `GetAssignment` | Any | Get a single assignment by ID |
| `GetAssignmentsByCourse` | Any | List assignments for a course (limit, offset) |
| `UpdateAssignment` | Tutor / admin | Update title, description, or due_date |
| `DeleteAssignment` | Tutor / admin | Delete an assignment |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50059` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `COURSE_SERVICE_ADDR` | `localhost:50053` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/assignments?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up assignment-service
```
