package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	"auth-service/proto/authpb"
	"course-service/proto/coursepb"
	"enrollment-service/internal/config"
	"enrollment-service/internal/handler"
	"enrollment-service/internal/middleware"
	"enrollment-service/internal/repository"
	"enrollment-service/internal/service"
	"enrollment-service/proto/enrollmentpb"

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

	repo := repository.NewPostgresRepo(db)
	svc := service.NewEnrollmentService(repo, courseClient)
	h := handler.NewEnrollmentHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authClient)),
	)
	enrollmentpb.RegisterEnrollmentServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	log.Printf("enrollment-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
