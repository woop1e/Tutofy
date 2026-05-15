FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY auth-service/ ./auth-service/
COPY progress-service/ ./progress-service/
COPY certificate-service/ ./certificate-service/
WORKDIR /app/certificate-service
RUN n=0; until GONOSUMDB=* GODEBUG=http2client=0 go mod download; do n=$((n+1)); [ $n -ge 5 ] && exit 1; echo "retry $n..."; sleep 15; done
RUN CGO_ENABLED=0 GOOS=linux GONOSUMDB=* go build -mod=mod -o /bin/service ./cmd

FROM alpine:3.20
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/service /bin/service
EXPOSE 50066
CMD ["/bin/service"]
