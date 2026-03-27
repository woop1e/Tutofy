# user-service

## Run

```bash
# 1. Apply schema
psql $DB_URL -f schema.sql

# 2. Fetch dependencies
go mod tidy

# 3. Run
export DB_URL="postgres://user:pass@localhost:5432/olms?sslmode=disable"
export PORT=50052
export AUTH_SERVICE_ADDR=localhost:50051
go run ./cmd/main.go
```

## Proto regeneration (optional)
```bash
protoc --go_out=. --go-grpc_out=. proto/user.proto proto/auth.proto
```
Replace `proto/user_grpc.go` and `proto/auth_grpc.go` with the generated output.
