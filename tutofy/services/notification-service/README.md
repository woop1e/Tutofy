# notification-service

Stores and delivers in-app notifications. Currently triggered by grading-service when a grade is submitted.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `NotifyGrade` | Internal (grading-service) | Create a grade notification for a student |
| `GetNotifications` | Student (own) / admin | List notifications (limit, offset, unread_only) |
| `MarkAsRead` | Owner | Mark a notification as read |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50057` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/notifications?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up notification-service
```
