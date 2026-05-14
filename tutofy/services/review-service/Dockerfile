FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY auth-service/ ./auth-service/
COPY enrollment-service/ ./enrollment-service/
COPY course-service/ ./course-service/
COPY progress-service/ ./progress-service/
COPY review-service/ ./review-service/
WORKDIR /app/review-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/service ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/service /bin/service
EXPOSE 50065
CMD ["/bin/service"]
