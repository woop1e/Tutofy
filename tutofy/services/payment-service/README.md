# payment-service

Records course payments and manages payment status transitions. No external payment provider is integrated — this is the data layer for future webhook integration.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreatePayment` | Any authenticated user | Create a payment record (status: pending) |
| `GetPayment` | Owner / admin | Get payment by ID |
| `GetUserPayments` | Owner / admin | List payments for a user (limit, offset) |
| `CompletePayment` | Admin | Transition pending → completed |
| `FailPayment` | Admin | Transition pending → failed |

Only `pending` payments can be transitioned. Status values: `pending`, `completed`, `failed`, `refunded`.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50061` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/payments?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up payment-service
```
