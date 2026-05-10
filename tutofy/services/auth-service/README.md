# auth-service

Handles user registration, login, and JWT token validation for all other services.

## Endpoints (gRPC)

| RPC | Description |
|---|---|
| `Register` | Create account — name, email, password, role |
| `Login` | Authenticate and receive a JWT |
| `ValidateToken` | Validate a JWT and return user_id + role |

**Roles:** `student`, `tutor`, `admin`, `parent`

**Validation:** email format, password min 8 chars, name required.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `JWT_SECRET` | — | Yes |
| `PORT` | `50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/auth?sslmode=disable \
JWT_SECRET=mysecret \
go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up auth-service
```
