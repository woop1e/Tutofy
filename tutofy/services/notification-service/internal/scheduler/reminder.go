package scheduler

import (
	"context"
	"database/sql"
	"log"
	"time"

	"notification-service/internal/email"
	"notification-service/internal/model"
	"notification-service/internal/repository"

	"user-service/proto/userpb"

	"github.com/google/uuid"
)

// StartReminderScheduler fires every 5 minutes, finds due reminders, and sends
// in-app + email notifications. It blocks until ctx is cancelled.
func StartReminderScheduler(ctx context.Context, db *sql.DB, repo repository.NotificationRepository, mailer *email.Mailer, userClient userpb.UserServiceClient) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			processDueReminders(db, repo, mailer, userClient)
		}
	}
}

type lessonReminder struct {
	LessonID  string
	StudentID string
	TutorID   string
	Title     string
	RemindAt  time.Time
}

func processDueReminders(db *sql.DB, repo repository.NotificationRepository, mailer *email.Mailer, userClient userpb.UserServiceClient) {
	rows, err := db.QueryContext(context.Background(),
		`SELECT lesson_id, student_id, tutor_id, title, remind_at
		 FROM lesson_reminders
		 WHERE remind_at <= NOW() AND sent = FALSE`,
	)
	if err != nil {
		log.Printf("reminder scheduler: query failed: %v", err)
		return
	}
	defer rows.Close()

	var due []lessonReminder
	for rows.Next() {
		var r lessonReminder
		if err := rows.Scan(&r.LessonID, &r.StudentID, &r.TutorID, &r.Title, &r.RemindAt); err != nil {
			log.Printf("reminder scheduler: scan failed: %v", err)
			continue
		}
		due = append(due, r)
	}

	for _, r := range due {
		msg := "Reminder: your lesson \"" + r.Title + "\" starts in about 1 hour."
		n := &model.Notification{
			ID:        uuid.NewString(),
			UserID:    r.StudentID,
			Type:      model.NotificationTypeLessonReminder,
			Message:   msg,
			IsRead:    false,
			CreatedAt: time.Now(),
		}
		if err := repo.CreateNotification(context.Background(), n); err != nil {
			log.Printf("reminder scheduler: create notification failed: %v", err)
		}

		if mailer != nil && userClient != nil {
			go func(r lessonReminder, msg string) {
				resp, err := userClient.GetUser(context.Background(), &userpb.GetUserRequest{UserId: r.StudentID})
				if err != nil {
					log.Printf("reminder: fetch user %s: %v", r.StudentID, err)
					return
				}
				if err := mailer.SendEmail(resp.GetEmail(), "Upcoming Lesson Reminder", msg); err != nil {
					log.Printf("reminder: email to %s: %v", resp.GetEmail(), err)
				}
			}(r, msg)
		}

		if _, err := db.ExecContext(context.Background(),
			`UPDATE lesson_reminders SET sent = TRUE WHERE lesson_id = $1`, r.LessonID,
		); err != nil {
			log.Printf("reminder scheduler: mark sent failed for lesson %s: %v", r.LessonID, err)
		}
	}
}
