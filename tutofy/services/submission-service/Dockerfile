FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY auth-service/ ./auth-service/
COPY assignment-service/ ./assignment-service/
COPY course-service/ ./course-service/
COPY enrollment-service/ ./enrollment-service/
COPY submission-service/ ./submission-service/
WORKDIR /app/submission-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/service ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/service /bin/service
EXPOSE 50063
CMD ["/bin/service"]
