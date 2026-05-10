# user-service

Manages user profiles — read, update, and delete. All requests require a valid JWT.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `GetUser` | Any | Get user by ID |
| `UpdateUser` | Self or admin | Update name / email |
| `GetAllUsers` | Admin | List all users (limit, offset) |
| `DeleteUser` | Admin | Hard-delete a user |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50052` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/users?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up user-service
```
