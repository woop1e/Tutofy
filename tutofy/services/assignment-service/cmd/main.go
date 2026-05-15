package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	"auth-service/proto/authpb"
	"assignment-service/internal/config"
	"assignment-service/internal/handler"
	"assignment-service/internal/middleware"
	"assignment-service/internal/repository"
	"assignment-service/internal/service"
	"assignment-service/proto/assignmentpb"
	"course-service/proto/coursepb"

	_ "github.com/lib/pq"
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

	courseConn, err := grpc.NewClient(cfg.CourseServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("course-service dial: %v", err)
	}
	defer courseConn.Close()

	authClient := authpb.NewAuthServiceClient(authConn)
	courseClient := coursepb.NewCourseServiceClient(courseConn)

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS assignments (
			id          TEXT PRIMARY KEY,
			title       TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			course_id   TEXT NOT NULL,
			due_date    TIMESTAMPTZ,
			deleted_at  TIMESTAMPTZ
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewAssignmentService(repo, courseClient)
	h := handler.NewAssignmentHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	assignmentpb.RegisterAssignmentServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("assignment-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
