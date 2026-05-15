package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"notification-service/proto/notificationpb"
	"messaging-service/internal/config"
	"messaging-service/internal/handler"
	"messaging-service/internal/middleware"
	"messaging-service/internal/repository"
	"messaging-service/internal/service"
	"messaging-service/proto/messagingpb"
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

	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("auth-service dial: %v", err)
	}
	defer authConn.Close()

	notifConn, err := grpc.NewClient(cfg.NotificationServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("notification-service dial: %v", err)
	}
	defer notifConn.Close()

	authClient := authpb.NewAuthServiceClient(authConn)

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS messages (
			id          TEXT        PRIMARY KEY,
			sender_id   TEXT        NOT NULL,
			receiver_id TEXT        NOT NULL,
			content     TEXT        NOT NULL DEFAULT '',
			is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewMessageService(repo, notificationpb.NewNotificationServiceClient(notifConn))
	h := handler.NewMessagingHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	messagingpb.RegisterMessagingServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("messaging-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC serve: %v", err)
	}
}
