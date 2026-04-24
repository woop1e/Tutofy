package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	"progress-service/internal/config"
	"progress-service/internal/handler"
	"progress-service/internal/middleware"
	"progress-service/internal/repository"
	"progress-service/internal/service"
	"progress-service/proto/progresspb"

	"auth-service/proto/authpb"

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
