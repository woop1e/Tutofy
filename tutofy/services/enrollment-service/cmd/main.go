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
	"notification-service/proto/notificationpb"
	"payment-service/proto/paymentpb"

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

	paymentConn, err := grpc.NewClient(cfg.PaymentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("payment-service dial: %v", err)
	}
	defer paymentConn.Close()

	notificationConn, err := grpc.NewClient(cfg.NotificationServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("notification-service dial: %v", err)
	}
	defer notificationConn.Close()

	authClient         := authpb.NewAuthServiceClient(authConn)
	courseClient       := coursepb.NewCourseServiceClient(courseConn)
	paymentClient      := paymentpb.NewPaymentServiceClient(paymentConn)
	notificationClient := notificationpb.NewNotificationServiceClient(notificationConn)

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS enrollments (
			id        TEXT PRIMARY KEY,
			user_id   TEXT NOT NULL,
			course_id TEXT NOT NULL,
			UNIQUE (user_id, course_id)
		);
		CREATE TABLE IF NOT EXISTS enrollment_requests (
			id         TEXT PRIMARY KEY,
			user_id    TEXT NOT NULL,
			course_id  TEXT NOT NULL,
			status     TEXT NOT NULL DEFAULT 'pending',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE (user_id, course_id)
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewEnrollmentService(repo, courseClient, paymentClient, notificationClient)
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
