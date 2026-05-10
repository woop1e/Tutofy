# course-service

Manages course creation, retrieval, update, and deletion.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreateCourse` | Tutor / admin | Create a new course |
| `GetCourse` | Any | Get course by ID |
| `GetAllCourses` | Any | List all courses (limit, offset) |
| `UpdateCourse` | Tutor-owner / admin | Update title and description |
| `DeleteCourse` | Tutor-owner / admin | Delete a course |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50053` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/courses?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up course-service
```
