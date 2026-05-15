package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"

	"media-service/internal/client"
	"media-service/internal/config"
	"media-service/internal/handler"
	"media-service/internal/middleware"
	"media-service/internal/repository"
	"media-service/internal/service"
	"media-service/internal/storage"
	"media-service/proto/mediapb"

	"auth-service/proto/authpb"
	"enrollment-service/proto/enrollmentpb"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// Connect to PostgreSQL.
	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	// Connect to S3 / MinIO.
	s3Client, err := storage.NewClient(ctx, storage.Config{
		Endpoint:        cfg.S3Endpoint,
		PublicEndpoint:  cfg.S3PublicEndpoint,
		AccessKeyID:     cfg.S3AccessKeyID,
		SecretAccessKey: cfg.S3SecretAccessKey,
		Bucket:          cfg.S3Bucket,
		Region:          cfg.S3Region,
	})
	if err != nil {
		log.Fatalf("failed to create S3 client: %v", err)
	}
	if err := s3Client.EnsureBucket(ctx); err != nil {
		log.Fatalf("failed to ensure S3 bucket: %v", err)
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

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS media_files (
			id          TEXT        PRIMARY KEY,
			course_id   TEXT        NOT NULL,
			uploader_id TEXT        NOT NULL,
			file_name   TEXT        NOT NULL DEFAULT '',
			s3_key      TEXT        NOT NULL DEFAULT '',
			file_type   INT         NOT NULL DEFAULT 0,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	// Wire up layers.
	repo := repository.NewPostgresRepo(db)
	enrollmentClient := client.NewEnrollmentClient(enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	svc := service.NewMediaService(repo, s3Client, enrollmentClient)
	h := handler.NewMediaHandler(svc)

	// Start gRPC server.
	// Note: increase max message size to handle file uploads (default is 4MB).
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
		grpc.MaxRecvMsgSize(50*1024*1024), // 50MB
		grpc.MaxSendMsgSize(50*1024*1024), // 50MB
	)
	mediapb.RegisterMediaServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.Port, err)
	}

	log.Printf("media-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}
