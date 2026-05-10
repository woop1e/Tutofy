# messaging-service

Provides direct messaging between any two authenticated users (student↔tutor, student↔student, etc.).

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `SendMessage` | Any | Send a message to another user |
| `GetConversation` | Any | Retrieve message history with another user (limit, offset) |
| `GetUserConversations` | Any | List all conversations with last-message preview (limit, offset) |

The sender ID is always taken from the JWT — clients cannot spoof it.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50060` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/messaging?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up messaging-service
```
