package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"time"

	"lesson-service/internal/client"
	"lesson-service/internal/config"
	"lesson-service/internal/handler"
	"lesson-service/internal/middleware"
	"lesson-service/internal/repository"
	"lesson-service/internal/service"
	"lesson-service/proto/lessonpb"

	"auth-service/proto/authpb"
	"course-service/proto/coursepb"
	"enrollment-service/proto/enrollmentpb"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	cfg := config.Load()

	// Connect to PostgreSQL.
	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	// Connect to auth-service.
	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to auth-service: %v", err)
	}
	defer authConn.Close()

	// Connect to enrollment-service.
	enrollmentConn, err := grpc.NewClient(cfg.EnrollmentSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to enrollment-service: %v", err)
	}
	defer enrollmentConn.Close()

	// Connect to course-service.
	courseConn, err := grpc.NewClient(cfg.CourseSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to course-service: %v", err)
	}
	defer courseConn.Close()

	// Connect to NATS (replaces direct progress-service gRPC calls).
	nc, err := nats.Connect(cfg.NATSAddr)
	if err != nil {
		log.Printf("warn: NATS unavailable — lesson progress events disabled: %v", err)
		nc = nil
	}
	if nc != nil {
		defer nc.Close()
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS lessons (
			id               TEXT        PRIMARY KEY,
			course_id        TEXT        NOT NULL,
			tutor_id         TEXT        NOT NULL,
			title            TEXT        NOT NULL,
			scheduled_at     TIMESTAMPTZ NOT NULL,
			duration_minutes INTEGER     NOT NULL,
			video_link       TEXT        NOT NULL DEFAULT '',
			status           SMALLINT    NOT NULL DEFAULT 1,
			deleted_at       TIMESTAMPTZ
		);
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_id TEXT NOT NULL DEFAULT '';
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS calendar_event_id TEXT NOT NULL DEFAULT '';
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_rating INTEGER;
		CREATE TABLE IF NOT EXISTS lesson_attendance (
			lesson_id  TEXT    NOT NULL,
			student_id TEXT    NOT NULL,
			attended   BOOLEAN NOT NULL DEFAULT FALSE,
			status     TEXT    NOT NULL DEFAULT 'absent',
			PRIMARY KEY (lesson_id, student_id)
		);
		ALTER TABLE lesson_attendance ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'absent';
		CREATE TABLE IF NOT EXISTS lesson_materials (
			id          TEXT        PRIMARY KEY,
			lesson_id   TEXT        NOT NULL,
			file_id     TEXT        NOT NULL,
			title       TEXT        NOT NULL DEFAULT '',
			uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	// Wire up layers.
	repo := repository.NewPostgresRepo(db)
	enrollmentClient := client.NewEnrollmentClient(enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	courseClient := client.NewCourseClient(coursepb.NewCourseServiceClient(courseConn))
	svc := service.NewLessonService(repo, enrollmentClient, courseClient, nc, authpb.NewAuthServiceClient(authConn))
	h := handler.NewLessonHandler(svc)

	// Background goroutine: expire AWAITING_PAYMENT lessons past their deadline.
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			n, err := svc.ExpireOverduePayments(context.Background())
			if err != nil {
				log.Printf("warn: expire overdue payments: %v", err)
			} else if n > 0 {
				log.Printf("info: expired %d overdue lesson payments", n)
			}
		}
	}()

	// Start gRPC server.
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	lessonpb.RegisterLessonServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.Port, err)
	}

	log.Printf("lesson-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}
