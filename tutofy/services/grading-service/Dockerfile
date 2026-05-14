FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY auth-service/ ./auth-service/
COPY assignment-service/ ./assignment-service/
COPY enrollment-service/ ./enrollment-service/
COPY course-service/ ./course-service/
COPY notification-service/ ./notification-service/
COPY grading-service/ ./grading-service/
WORKDIR /app/grading-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/service ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/service /bin/service
EXPOSE 50056
CMD ["/bin/service"]
