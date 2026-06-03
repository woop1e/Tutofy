package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"
	"time"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"enrollment-service/proto/enrollmentpb"
	"quiz-service/internal/config"
	"quiz-service/internal/handler"
	"quiz-service/internal/middleware"
	"quiz-service/internal/repository"
	"quiz-service/internal/service"
	"quiz-service/proto/quizpb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS quizzes (
			id         TEXT PRIMARY KEY,
			course_id  TEXT NOT NULL,
			title      TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS questions (
			id       TEXT PRIMARY KEY,
			quiz_id  TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
			text     TEXT NOT NULL,
			position INTEGER NOT NULL DEFAULT 0
		);
		CREATE TABLE IF NOT EXISTS options (
			id          TEXT PRIMARY KEY,
			question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
			text        TEXT NOT NULL,
			is_correct  BOOLEAN NOT NULL DEFAULT FALSE
		);
		CREATE TABLE IF NOT EXISTS quiz_attempts (
			id           TEXT PRIMARY KEY,
			quiz_id      TEXT NOT NULL,
			student_id   TEXT NOT NULL,
			score        INTEGER NOT NULL DEFAULT 0,
			total        INTEGER NOT NULL DEFAULT 0,
			started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ
		);
		CREATE TABLE IF NOT EXISTS attempt_answers (
			attempt_id  TEXT NOT NULL,
			question_id TEXT NOT NULL,
			option_id   TEXT NOT NULL,
			PRIMARY KEY (attempt_id, question_id)
		);
		CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions (quiz_id);
		CREATE INDEX IF NOT EXISTS idx_options_question ON options (question_id);
		CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts (student_id, quiz_id);
	`)
	if err != nil {
		return err
	}
	_, err = db.Exec(`
		ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER NOT NULL DEFAULT 0;
		ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 0;
		ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
		ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
	`)
	return err
}

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer db.Close()
	for i := 1; i <= 15; i++ {
		if err = db.Ping(); err == nil {
			break
		}
		log.Printf("db ping attempt %d/15: %v — retrying in %ds", i, err, i*2)
		time.Sleep(time.Duration(i*2) * time.Second)
	}
	if err != nil {
		log.Fatalf("db ping: %v", err)
	}
	if err := migrate(db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("auth dial: %v", err)
	}
	defer authConn.Close()

	enrollmentConn, err := grpc.NewClient(cfg.EnrollmentServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("enrollment dial: %v", err)
	}
	defer enrollmentConn.Close()

	repo := repository.NewPostgresRepo(db)
	svc := service.NewQuizService(repo, enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	h := handler.NewQuizHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	quizpb.RegisterQuizServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("quiz-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
