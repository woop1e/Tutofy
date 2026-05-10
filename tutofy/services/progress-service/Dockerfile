FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY auth-service/ ./auth-service/
COPY progress-service/ ./progress-service/
WORKDIR /app/progress-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/service ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/service /bin/service
EXPOSE 50058
CMD ["/bin/service"]
