package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"time"

	"notification-service/internal/config"
	"notification-service/internal/email"
	"notification-service/internal/handler"
	"notification-service/internal/middleware"
	"notification-service/internal/repository"
	"notification-service/internal/scheduler"
	"notification-service/internal/service"
	"notification-service/proto/notificationpb"

	"auth-service/proto/authpb"
	"user-service/proto/userpb"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type gradeEvent struct {
	AssignmentID string  `json:"assignment_id"`
	StudentID    string  `json:"student_id"`
	Grade        float32 `json:"grade"`
	Feedback     string  `json:"feedback"`
}

type lessonConfirmedEvent struct {
	LessonID    string  `json:"lesson_id"`
	StudentID   string  `json:"student_id"`
	TutorID     string  `json:"tutor_id"`
	Title       string  `json:"title"`
	ScheduledAt string  `json:"scheduled_at"`
	Price       float64 `json:"price"`
}

type lessonDeclinedEvent struct {
	LessonID  string `json:"lesson_id"`
	StudentID string `json:"student_id"`
	TutorID   string `json:"tutor_id"`
	Title     string `json:"title"`
}

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	authConn, err := grpc.NewClient(cfg.AuthServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to auth-service: %v", err)
	}
	defer authConn.Close()

	userConn, err := grpc.NewClient(cfg.UserServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to user-service: %v", err)
	}
	defer userConn.Close()
	userClient := userpb.NewUserServiceClient(userConn)

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS notifications (
			id         TEXT        PRIMARY KEY,
			user_id    TEXT        NOT NULL,
			type       INT         NOT NULL DEFAULT 0,
			message    TEXT        NOT NULL DEFAULT '',
			is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS lesson_reminders (
			lesson_id  TEXT        PRIMARY KEY,
			student_id TEXT        NOT NULL,
			tutor_id   TEXT        NOT NULL,
			title      TEXT        NOT NULL,
			remind_at  TIMESTAMPTZ NOT NULL,
			sent       BOOLEAN     NOT NULL DEFAULT FALSE
		);
	`); err != nil {
		log.Fatalf("schema migration: %v", err)
	}

	mailer := email.New(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPFrom)

	repo := repository.NewPostgresRepo(db)
	svc := service.NewNotificationService(repo, mailer, userClient)
	h := handler.NewNotificationHandler(svc)

	nc, err := nats.Connect(cfg.NATSAddr)
	if err != nil {
		log.Printf("warn: NATS unavailable — async notifications disabled: %v", err)
	} else {
		defer nc.Close()

		_, _ = nc.Subscribe("grade.submitted", func(msg *nats.Msg) {
			var ev gradeEvent
			if err := json.Unmarshal(msg.Data, &ev); err != nil {
				log.Printf("warn: bad grade.submitted payload: %v", err)
				return
			}
			if err := svc.NotifyGrade(context.Background(), ev.AssignmentID, ev.StudentID, ev.Grade); err != nil {
				log.Printf("warn: NotifyGrade failed: %v", err)
			}
		})

		_, _ = nc.Subscribe("lesson.confirmed", func(msg *nats.Msg) {
			var ev lessonConfirmedEvent
			if err := json.Unmarshal(msg.Data, &ev); err != nil {
				log.Printf("warn: bad lesson.confirmed payload: %v", err)
				return
			}

			// In-app + email: booking confirmed for student
			almatyTZ := time.FixedZone("UTC+5", 5*60*60)
			timeStr := ev.ScheduledAt
			if t, err2 := time.Parse(time.RFC3339, ev.ScheduledAt); err2 == nil {
				timeStr = t.In(almatyTZ).Format("Mon, Jan 2 at 15:04 (UTC+5)")
			}
			notifMsg := fmt.Sprintf("Your lesson \"%s\" has been confirmed by your tutor! It starts on %s.", ev.Title, timeStr)
			_ = svc.NotifyUser(context.Background(), ev.StudentID, 9, notifMsg) // BOOKING_CONFIRMED

			// Schedule a 1-hour-before reminder
			if _, err := db.ExecContext(context.Background(),
				`INSERT INTO lesson_reminders (lesson_id, student_id, tutor_id, title, remind_at, sent)
				 VALUES ($1, $2, $3, $4, $5::timestamptz - interval '1 hour', FALSE)
				 ON CONFLICT (lesson_id) DO NOTHING`,
				ev.LessonID, ev.StudentID, ev.TutorID, ev.Title, ev.ScheduledAt,
			); err != nil {
				log.Printf("warn: insert lesson_reminder for %s: %v", ev.LessonID, err)
			}
		})

		_, _ = nc.Subscribe("lesson.declined", func(msg *nats.Msg) {
			var ev lessonDeclinedEvent
			if err := json.Unmarshal(msg.Data, &ev); err != nil {
				log.Printf("warn: bad lesson.declined payload: %v", err)
				return
			}
			notifMsg := fmt.Sprintf("Unfortunately, your lesson request \"%s\" was declined by the tutor.", ev.Title)
			_ = svc.NotifyUser(context.Background(), ev.StudentID, 10, notifMsg) // BOOKING_DECLINED
		})

		log.Printf("notification-service: subscribed to NATS topics on %s", cfg.NATSAddr)
	}

	// Start reminder scheduler in background.
	go scheduler.StartReminderScheduler(context.Background(), db, repo, mailer, userClient)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	notificationpb.RegisterNotificationServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.Port, err)
	}

	log.Printf("notification-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}
