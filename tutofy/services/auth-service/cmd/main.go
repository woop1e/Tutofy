package main

import (
	"auth-service/internal/config"
	"auth-service/internal/handler"
	"auth-service/internal/middleware"
	"auth-service/internal/repository"
	"auth-service/internal/service"
	"auth-service/proto/authpb"
	"context"
	"database/sql"
	"log"
	"net"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("db unreachable: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("warn: redis unavailable at %s — caching disabled: %v", cfg.RedisAddr, err)
		rdb = nil
	}
	if rdb != nil {
		defer rdb.Close()
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id         TEXT PRIMARY KEY,
			email      TEXT NOT NULL UNIQUE,
			password   TEXT NOT NULL,
			name       TEXT NOT NULL DEFAULT '',
			role       TEXT NOT NULL DEFAULT 'student'
		);
		CREATE TABLE IF NOT EXISTS google_tokens (
			user_id       TEXT PRIMARY KEY,
			access_token  TEXT NOT NULL,
			refresh_token TEXT NOT NULL DEFAULT '',
			token_expiry  TIMESTAMPTZ NOT NULL
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewAuthService(repo, cfg.JWTSecret, rdb)
	h := handler.NewAuthHandler(svc, repo)

	lis, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.RecoveryInterceptor),
	)
	authpb.RegisterAuthServiceServer(grpcServer, h)

	log.Printf("auth-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
