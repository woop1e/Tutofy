package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"

	"auth-service/proto/authpb"
	"course-service/internal/config"
	"course-service/internal/handler"
	"course-service/internal/middleware"
	"course-service/internal/repository"
	"course-service/internal/service"
	"course-service/proto/coursepb"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
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

	var rdb *redis.Client
	if opt, err := redis.ParseURL(cfg.RedisAddr); err == nil {
		rdb = redis.NewClient(opt)
	} else {
		rdb = redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	}
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("warn: redis unavailable — caching disabled: %v", err)
		rdb = nil
	}
	if rdb != nil {
		defer rdb.Close()
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS courses (
			id                  TEXT PRIMARY KEY,
			title               TEXT NOT NULL,
			description         TEXT NOT NULL DEFAULT '',
			tutor_id            TEXT NOT NULL,
			price               DOUBLE PRECISION NOT NULL DEFAULT 0,
			course_type         TEXT NOT NULL DEFAULT 'group',
			max_students        INT NOT NULL DEFAULT 5,
			enrollment_deadline TIMESTAMPTZ,
			is_published        BOOLEAN NOT NULL DEFAULT FALSE,
			created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			deleted_at          TIMESTAMPTZ
		);
		CREATE TABLE IF NOT EXISTS tags (
			id   TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE
		);
		CREATE TABLE IF NOT EXISTS course_tags (
			course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
			tag_id    TEXT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
			PRIMARY KEY (course_id, tag_id)
		);
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_lessons INT NOT NULL DEFAULT 0;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_weeks   INT NOT NULL DEFAULT 0;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS release_type  TEXT NOT NULL DEFAULT 'static';
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date                TIMESTAMPTZ;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date                  TIMESTAMPTZ;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_attendance_pct INT NOT NULL DEFAULT 0;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_grade_pct      INT NOT NULL DEFAULT 0;
		ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_status             TEXT NOT NULL DEFAULT 'draft';
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewCourseService(repo, rdb)
	h := handler.NewCourseHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	coursepb.RegisterCourseServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("course-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
