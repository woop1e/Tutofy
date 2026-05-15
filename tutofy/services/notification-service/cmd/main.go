package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"

	"notification-service/internal/config"
	"notification-service/internal/handler"
	"notification-service/internal/middleware"
	"notification-service/internal/repository"
	"notification-service/internal/service"
	"notification-service/proto/notificationpb"

	"auth-service/proto/authpb"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type gradeEvent struct {
	AssignmentID string  `json:"assignment_id"`
	StudentID    string  `json:"student_id"`
	Grade        float32 `json:"grade"`
	Feedback     string  `json:"feedback"`
}

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

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS notifications (
			id         TEXT        PRIMARY KEY,
			user_id    TEXT        NOT NULL,
			type       INT         NOT NULL DEFAULT 0,
			message    TEXT        NOT NULL DEFAULT '',
			is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	// Wire up layers.
	repo := repository.NewPostgresRepo(db)
	svc := service.NewNotificationService(repo)
	h := handler.NewNotificationHandler(svc)

	// Subscribe to NATS grade.submitted events.
	nc, err := nats.Connect(cfg.NATSAddr)
	if err != nil {
		log.Printf("warn: NATS unavailable — grade notifications via NATS disabled: %v", err)
	} else {
		defer nc.Close()
		_, _ = nc.Subscribe("grade.submitted", func(msg *nats.Msg) {
			var ev gradeEvent
			if err := json.Unmarshal(msg.Data, &ev); err != nil {
				log.Printf("warn: bad grade.submitted payload: %v", err)
				return
			}
			if err := svc.NotifyGrade(context.Background(), ev.AssignmentID, ev.StudentID, ev.Grade); err != nil {
				log.Printf("warn: NotifyGrade failed: %v", err)
			}
		})
		log.Printf("notification-service: subscribed to grade.submitted on %s", cfg.NATSAddr)
	}

	// Start gRPC server.
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	notificationpb.RegisterNotificationServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.Port, err)
	}

	log.Printf("notification-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}
