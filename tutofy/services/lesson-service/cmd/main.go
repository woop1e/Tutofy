package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	"lesson-service/internal/client"
	"lesson-service/internal/config"
	"lesson-service/internal/handler"
	"lesson-service/internal/middleware"
	"lesson-service/internal/repository"
	"lesson-service/internal/service"
	"lesson-service/proto/lessonpb"

	"auth-service/proto/authpb"
	"enrollment-service/proto/enrollmentpb"
	"progress-service/proto/progresspb"

	_ "github.com/lib/pq"
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

	// Connect to progress-service.
	progressConn, err := grpc.NewClient(cfg.ProgressSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to progress-service: %v", err)
	}
	defer progressConn.Close()

	// Wire up layers.
	repo := repository.NewPostgresRepo(db)
	enrollmentClient := client.NewEnrollmentClient(enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	progressClient := client.NewProgressClient(progresspb.NewProgressServiceClient(progressConn))
	svc := service.NewLessonService(repo, enrollmentClient, progressClient)
	h := handler.NewLessonHandler(svc)

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
