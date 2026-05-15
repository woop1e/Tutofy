package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"enrollment-service/proto/enrollmentpb"
	"progress-service/proto/progresspb"
	"review-service/internal/config"
	"review-service/internal/handler"
	"review-service/internal/middleware"
	"review-service/internal/repository"
	"review-service/internal/service"
	"review-service/proto/reviewpb"
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

	dial := func(addr string) *grpc.ClientConn {
		conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			log.Fatalf("dial %s: %v", addr, err)
		}
		return conn
	}

	authConn       := dial(cfg.AuthServiceAddr)
	progressConn   := dial(cfg.ProgressServiceAddr)
	enrollmentConn := dial(cfg.EnrollmentServiceAddr)
	defer authConn.Close()
	defer progressConn.Close()
	defer enrollmentConn.Close()

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS reviews (
			id         TEXT        PRIMARY KEY,
			course_id  TEXT        NOT NULL,
			student_id TEXT        NOT NULL,
			rating     INT         NOT NULL DEFAULT 0,
			body       TEXT        NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (student_id, course_id)
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewReviewService(
		repo,
		progresspb.NewProgressServiceClient(progressConn),
		enrollmentpb.NewEnrollmentServiceClient(enrollmentConn),
	)
	h := handler.NewReviewHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	reviewpb.RegisterReviewServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("review-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
