package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"

	"progress-service/internal/config"
	"progress-service/internal/handler"
	"progress-service/internal/middleware"
	"progress-service/internal/model"
	"progress-service/internal/repository"
	"progress-service/internal/service"
	"progress-service/proto/progresspb"

	"auth-service/proto/authpb"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type lessonStatusEvent struct {
	CourseID   string   `json:"course_id"`
	LessonID   string   `json:"lesson_id"`
	StudentIDs []string `json:"student_ids"`
	Status     string   `json:"status"`
}

var statusMap = map[string]model.LessonStatus{
	"PLANNED":   model.LessonStatusPlanned,
	"COMPLETED": model.LessonStatusCompleted,
	"CANCELLED": model.LessonStatusCancelled,
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

	// Connect to auth-service for token validation.
	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to auth-service: %v", err)
	}
	defer authConn.Close()
	authClient := authpb.NewAuthServiceClient(authConn)

	// Wire up layers.
	repo := repository.NewPostgresRepo(db)
	svc := service.NewProgressService(repo)
	h := handler.NewProgressHandler(svc)

	// Subscribe to NATS lesson.status_changed events.
	nc, err := nats.Connect(cfg.NATSAddr)
	if err != nil {
		log.Printf("warn: NATS unavailable — lesson progress via NATS disabled: %v", err)
	} else {
		defer nc.Close()
		_, _ = nc.Subscribe("lesson.status_changed", func(msg *nats.Msg) {
			var ev lessonStatusEvent
			if err := json.Unmarshal(msg.Data, &ev); err != nil {
				log.Printf("warn: bad lesson.status_changed payload: %v", err)
				return
			}
			st, ok := statusMap[ev.Status]
			if !ok {
				return
			}
			for _, studentID := range ev.StudentIDs {
				if err := svc.RecordLessonEvent(context.Background(), studentID, ev.CourseID, ev.LessonID, st); err != nil {
					log.Printf("warn: RecordLessonEvent for student %s failed: %v", studentID, err)
				}
			}
		})
		log.Printf("progress-service: subscribed to lesson.status_changed on %s", cfg.NATSAddr)
	}

	// Start gRPC server.
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	progresspb.RegisterProgressServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.Port, err)
	}

	log.Printf("progress-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}
