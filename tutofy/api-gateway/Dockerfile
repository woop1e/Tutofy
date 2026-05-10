FROM golang:1.22-alpine AS builder
WORKDIR /app
# Copy all service directories (gateway imports their proto packages)
COPY services/auth-service/ ./services/auth-service/
COPY services/user-service/ ./services/user-service/
COPY services/course-service/ ./services/course-service/
COPY services/enrollment-service/ ./services/enrollment-service/
COPY services/lesson-service/ ./services/lesson-service/
COPY services/assignment-service/ ./services/assignment-service/
COPY services/grading-service/ ./services/grading-service/
COPY services/notification-service/ ./services/notification-service/
COPY services/progress-service/ ./services/progress-service/
COPY services/payment-service/ ./services/payment-service/
COPY services/messaging-service/ ./services/messaging-service/
COPY services/media-service/ ./services/media-service/
COPY api-gateway/ ./api-gateway/
WORKDIR /app/api-gateway
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/gateway ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/gateway /bin/gateway
EXPOSE 8080
CMD ["/bin/gateway"]
