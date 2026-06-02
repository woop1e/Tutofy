package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"notification-service/internal/email"
	"notification-service/internal/model"
	"notification-service/internal/repository"

	"user-service/proto/userpb"

	"github.com/google/uuid"
)

var ErrForbidden = errors.New("forbidden")

// emailSubjects maps notification types to email subject lines.
// Types not in this map do not trigger an email.
var emailSubjects = map[model.NotificationType]string{
	model.NotificationTypeEnrollment:         "Course Enrollment Confirmed",
	model.NotificationTypeLessonReminder:     "Upcoming Lesson Reminder",
	model.NotificationTypeBookingRequest:     "New Lesson Booking Request",
	model.NotificationTypeBookingConfirmed:   "Lesson Booking Confirmed",
	model.NotificationTypeBookingDeclined:    "Lesson Booking Declined",
	model.NotificationTypeEnrollmentApproved: "Enrollment Request Approved",
	model.NotificationTypeEnrollmentRejected: "Enrollment Request Update",
	model.NotificationTypeTutorApproved:      "Your Tutor Profile Has Been Approved",
	model.NotificationTypeTutorRejected:      "Update on Your Tutor Profile Application",
}

// NotificationService is the business-logic contract.
type NotificationService interface {
	// NotifyGrade is called by grading-service when a grade is submitted.
	NotifyGrade(ctx context.Context, assignmentID, studentID string, grade float32) error
	NotifyUser(ctx context.Context, userID string, notifType int32, message string) error

	// GetNotifications returns notifications for the caller.
	// Students may only fetch their own; admins may fetch any user's.
	GetNotifications(ctx context.Context, callerID, callerRole, userID string, unreadOnly bool, limit, offset int32) ([]*model.Notification, error)

	// MarkAsRead marks a notification as read.
	// Only the owner of the notification may mark it read.
	MarkAsRead(ctx context.Context, callerID, notificationID string) error
}

type notificationService struct {
	repo       repository.NotificationRepository
	mailer     *email.Mailer
	userClient userpb.UserServiceClient
}

// NewNotificationService creates a NotificationService backed by the given repository.
func NewNotificationService(repo repository.NotificationRepository, mailer *email.Mailer, userClient userpb.UserServiceClient) NotificationService {
	return &notificationService{repo: repo, mailer: mailer, userClient: userClient}
}

func (s *notificationService) NotifyGrade(ctx context.Context, assignmentID, studentID string, grade float32) error {
	n := &model.Notification{
		ID:        uuid.NewString(),
		UserID:    studentID,
		Type:      model.NotificationTypeGrade,
		Message:   fmt.Sprintf("Your assignment %s has been graded: %.2f", assignmentID, grade),
		IsRead:    false,
		CreatedAt: time.Now().UTC(),
	}
	return s.repo.CreateNotification(ctx, n)
}

func (s *notificationService) GetNotifications(
	ctx context.Context,
	callerID, callerRole, userID string,
	unreadOnly bool,
	limit, offset int32,
) ([]*model.Notification, error) {
	if callerRole != "admin" && callerID != userID {
		return nil, ErrForbidden
	}
	return s.repo.GetNotifications(ctx, userID, unreadOnly, limit, offset)
}

func (s *notificationService) MarkAsRead(ctx context.Context, callerID, notificationID string) error {
	// MarkAsRead in the repo checks that the notification belongs to callerID,
	// so no extra ownership check is needed here.
	return s.repo.MarkAsRead(ctx, notificationID, callerID)
}

func (s *notificationService) NotifyUser(ctx context.Context, userID string, notifType int32, message string) error {
	nt := model.NotificationType(notifType)
	n := &model.Notification{
		ID:        uuid.NewString(),
		UserID:    userID,
		Type:      nt,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreateNotification(ctx, n); err != nil {
		return err
	}

	if subject, ok := emailSubjects[nt]; ok && s.mailer != nil && s.userClient != nil {
		go func() {
			userResp, err := s.userClient.GetUser(context.Background(), &userpb.GetUserRequest{UserId: userID})
			if err != nil {
				log.Printf("email: could not fetch user %s: %v", userID, err)
				return
			}
			if err := s.mailer.SendEmail(userResp.GetEmail(), subject, message); err != nil {
				log.Printf("email: send to %s failed: %v", userResp.GetEmail(), err)
			}
		}()
	}

	return nil
}
