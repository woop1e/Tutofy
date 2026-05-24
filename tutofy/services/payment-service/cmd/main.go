package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"payment-service/internal/config"
	"payment-service/internal/handler"
	"payment-service/internal/middleware"
	"payment-service/internal/repository"
	"payment-service/internal/service"
	"payment-service/proto/paymentpb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	authConn, err := grpc.NewClient(
		cfg.AuthServiceAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("auth-service dial: %v", err)
	}
	defer authConn.Close()

	authClient := authpb.NewAuthServiceClient(authConn)

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS payments (
			id         TEXT        PRIMARY KEY,
			user_id    TEXT        NOT NULL,
			course_id  TEXT        NOT NULL DEFAULT '',
			amount     DOUBLE PRECISION NOT NULL DEFAULT 0,
			status     TEXT        NOT NULL DEFAULT 'pending',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		ALTER TABLE payments ADD COLUMN IF NOT EXISTS lesson_id TEXT NOT NULL DEFAULT '';
		CREATE INDEX IF NOT EXISTS idx_payments_lesson_id ON payments (lesson_id);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewPaymentService(repo)
	h := handler.NewPaymentHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	paymentpb.RegisterPaymentServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("payment-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC serve: %v", err)
	}
}
