package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

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
