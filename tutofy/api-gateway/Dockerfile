FROM golang:1.25-alpine AS builder
WORKDIR /app
# Copy all service directories (gateway imports their proto packages)
COPY services/auth-service/ ./services/auth-service/
COPY services/review-service/ ./services/review-service/
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
COPY services/submission-service/ ./services/submission-service/
COPY services/quiz-service/ ./services/quiz-service/
COPY services/review-service/ ./services/review-service/
COPY services/certificate-service/ ./services/certificate-service/
COPY api-gateway/ ./api-gateway/
WORKDIR /app/api-gateway
RUN n=0; until GONOSUMDB=* GODEBUG=http2client=0 go mod download; do n=$((n+1)); [ $n -ge 5 ] && exit 1; echo "retry $n..."; sleep 15; done
RUN CGO_ENABLED=0 GOOS=linux GONOSUMDB=* go build -mod=mod -o /bin/gateway ./cmd

FROM alpine:3.20
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/gateway /bin/gateway
EXPOSE 8080
CMD ["/bin/gateway"]
