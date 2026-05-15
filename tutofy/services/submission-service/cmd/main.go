package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"
	"time"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"submission-service/internal/config"
	"submission-service/internal/handler"
	"submission-service/internal/middleware"
	"submission-service/internal/repository"
	"submission-service/internal/service"
	"submission-service/proto/submissionpb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const schema = `
CREATE TABLE IF NOT EXISTS submissions (
    id            TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id    TEXT NOT NULL,
    content       TEXT NOT NULL DEFAULT '',
    file_id       TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'submitted',
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);
`

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer db.Close()

	var pingErr error
	for i := 1; i <= 15; i++ {
		if pingErr = db.Ping(); pingErr == nil {
			break
		}
		log.Printf("db ping attempt %d/15: %v — retrying in %ds", i, pingErr, i*2)
		time.Sleep(time.Duration(i*2) * time.Second)
	}
	if pingErr != nil {
		log.Fatalf("db unreachable: %v", pingErr)
	}

	if _, err := db.Exec(schema); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("auth dial: %v", err)
	}
	defer authConn.Close()

	assignmentConn, err := grpc.NewClient(cfg.AssignmentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("assignment dial: %v", err)
	}
	defer assignmentConn.Close()

	enrollmentConn, err := grpc.NewClient(cfg.EnrollmentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("enrollment dial: %v", err)
	}
	defer enrollmentConn.Close()

	repo := repository.NewPostgresRepo(db)
	svc := service.NewSubmissionService(
		repo,
		assignmentpb.NewAssignmentServiceClient(assignmentConn),
		enrollmentpb.NewEnrollmentServiceClient(enrollmentConn),
	)
	h := handler.NewSubmissionHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	submissionpb.RegisterSubmissionServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("submission-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
