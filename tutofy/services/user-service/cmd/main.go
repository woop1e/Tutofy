package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"context"
	"github.com/redis/go-redis/v9"
	"user-service/internal/config"
	"user-service/internal/handler"
	"user-service/internal/middleware"
	"user-service/internal/repository"
	"user-service/internal/service"
	"user-service/proto/userpb"
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

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("warn: redis unavailable — caching disabled: %v", err)
		rdb = nil
	}
	if rdb != nil {
		defer rdb.Close()
	}

	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id               TEXT PRIMARY KEY,
			email            TEXT NOT NULL UNIQUE,
			name             TEXT NOT NULL DEFAULT '',
			role             TEXT NOT NULL DEFAULT 'student',
			bio              TEXT NOT NULL DEFAULT '',
			age              INT,
			location         TEXT NOT NULL DEFAULT '',
			photo_url        TEXT NOT NULL DEFAULT '',
			subjects         TEXT NOT NULL DEFAULT '[]',
			experience_years INT NOT NULL DEFAULT 0,
			certificates     TEXT NOT NULL DEFAULT '[]',
			updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			deleted_at       TIMESTAMPTZ
		)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS teaching_language TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_level TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_price INT NOT NULL DEFAULT 0`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS available_days TEXT NOT NULL DEFAULT '[]'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS available_time_start TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS available_time_end TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		// Fix existing rows where subjects/certificates default was '' instead of '[]'
		`UPDATE users SET subjects = '[]' WHERE subjects = '' OR subjects IS NULL`,
		`UPDATE users SET certificates = '[]' WHERE certificates = '' OR certificates IS NULL`,
		`UPDATE users SET available_days = '[]' WHERE available_days = '' OR available_days IS NULL`,
	}
	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			log.Fatalf("schema migration failed (%s): %v", m[:min(40, len(m))], err)
		}
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewUserService(repo, rdb)
	h := handler.NewUserHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	userpb.RegisterUserServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("user-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
