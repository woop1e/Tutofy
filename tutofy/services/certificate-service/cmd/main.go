package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"

	"auth-service/proto/authpb"
	"certificate-service/internal/config"
	"certificate-service/internal/handler"
	"certificate-service/internal/middleware"
	"certificate-service/internal/repository"
	"certificate-service/internal/service"
	"certificate-service/proto/certificatepb"
	"course-service/proto/coursepb"
	"progress-service/proto/progresspb"
	"user-service/proto/userpb"

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

	authConn     := dial(cfg.AuthServiceAddr)
	progressConn := dial(cfg.ProgressServiceAddr)
	userConn     := dial(cfg.UserServiceAddr)
	courseConn   := dial(cfg.CourseServiceAddr)
	defer authConn.Close()
	defer progressConn.Close()
	defer userConn.Close()
	defer courseConn.Close()

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS certificates (
			id           TEXT        PRIMARY KEY,
			student_id   TEXT        NOT NULL,
			course_id    TEXT        NOT NULL,
			tutor_id     TEXT        NOT NULL DEFAULT '',
			status       SMALLINT    NOT NULL DEFAULT 0,
			issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			student_name TEXT        NOT NULL DEFAULT '',
			course_name  TEXT        NOT NULL DEFAULT '',
			tutor_name   TEXT        NOT NULL DEFAULT '',
			UNIQUE (student_id, course_id)
		);
		ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tutor_id     TEXT     NOT NULL DEFAULT '';
		ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status       SMALLINT NOT NULL DEFAULT 0;
		ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_name TEXT     NOT NULL DEFAULT '';
		ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_name  TEXT     NOT NULL DEFAULT '';
		ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tutor_name   TEXT     NOT NULL DEFAULT '';
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	repo := repository.NewPostgresRepo(db)
	svc := service.NewCertificateService(
		repo,
		progresspb.NewProgressServiceClient(progressConn),
		userpb.NewUserServiceClient(userConn),
		coursepb.NewCourseServiceClient(courseConn),
	)
	h := handler.NewCertificateHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	certificatepb.RegisterCertificateServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("certificate-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
