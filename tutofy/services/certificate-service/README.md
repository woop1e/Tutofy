# certificate-service

Issues completion certificates when a student reaches 100% progress in a course. Certificates are verifiable by ID.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `IssueCertificate` | Admin (force) / any (auto, requires 100%) | Issue a certificate for a student in a course |
| `GetCertificate` | Owner / admin | Get a certificate by student + course |
| `GetUserCertificates` | Owner / admin | List all certificates for a student |

Admin callers can issue certificates without the 100% check.
One certificate per (student, course) pair — duplicate issues are silently idempotent.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50066` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `PROGRESS_SERVICE_ADDR` | `localhost:50058` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/certificates?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up certificate-service
```
