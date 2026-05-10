package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	"auth-service/proto/authpb"
	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/internal/config"
	"grading-service/internal/handler"
	"grading-service/internal/middleware"
	"grading-service/internal/repository"
	"grading-service/internal/service"
	"grading-service/proto/gradingpb"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
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

	assignmentConn, err := grpc.NewClient(cfg.AssignmentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("assignment-service dial: %v", err)
	}
	defer assignmentConn.Close()

	enrollmentConn, err := grpc.NewClient(cfg.EnrollmentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("enrollment-service dial: %v", err)
	}
	defer enrollmentConn.Close()

	nc, err := nats.Connect(cfg.NATSAddr)
	if err != nil {
		log.Printf("warn: NATS unavailable at %s — notifications disabled: %v", cfg.NATSAddr, err)
		nc = nil
	}
	if nc != nil {
		defer nc.Close()
	}

	authClient       := authpb.NewAuthServiceClient(authConn)
	assignmentClient := assignmentpb.NewAssignmentServiceClient(assignmentConn)
	enrollmentClient := enrollmentpb.NewEnrollmentServiceClient(enrollmentConn)

	repo := repository.NewPostgresRepo(db)
	svc  := service.NewGradingService(repo, assignmentClient, enrollmentClient, nc)
	h    := handler.NewGradingHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	gradingpb.RegisterGradingServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("grading-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
