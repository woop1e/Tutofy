module grading-service

go 1.25.9

require (
	assignment-service v0.0.0
	auth-service v0.0.0
	enrollment-service v0.0.0
	github.com/google/uuid v1.6.0
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.12.3
	github.com/nats-io/nats.go v1.34.0
	google.golang.org/grpc v1.80.0
	google.golang.org/protobuf v1.36.11
	notification-service v0.0.0
)

require (
	github.com/klauspost/compress v1.17.2 // indirect
	github.com/nats-io/nkeys v0.4.7 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	golang.org/x/crypto v0.47.0 // indirect
	golang.org/x/net v0.49.0 // indirect
	golang.org/x/sys v0.40.0 // indirect
	golang.org/x/text v0.33.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260120221211-b8f7ae30c516 // indirect
)

replace (
	assignment-service => ../assignment-service
	auth-service => ../auth-service
	course-service => ../course-service
	enrollment-service => ../enrollment-service
)

replace notification-service => ../notification-service
