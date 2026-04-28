package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"notification-service/internal/model"
	"notification-service/internal/repository"

	"github.com/google/uuid"
)

var ErrForbidden = errors.New("forbidden")

// NotificationService is the business-logic contract.
type NotificationService interface {
	// NotifyGrade is called by grading-service when a grade is submitted.
	NotifyGrade(ctx context.Context, assignmentID, studentID string, grade float32) error

	// GetNotifications returns notifications for the caller.
	// Students may only fetch their own; admins may fetch any user's.
	GetNotifications(ctx context.Context, callerID, callerRole, userID string, unreadOnly bool) ([]*model.Notification, error)

	// MarkAsRead marks a notification as read.
	// Only the owner of the notification may mark it read.
	MarkAsRead(ctx context.Context, callerID, notificationID string) error
}

type notificationService struct {
	repo repository.NotificationRepository
}

// NewNotificationService creates a NotificationService backed by the given repository.
func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
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
) ([]*model.Notification, error) {
	if callerRole != "admin" && callerID != userID {
		return nil, ErrForbidden
	}
	return s.repo.GetNotifications(ctx, userID, unreadOnly)
}

func (s *notificationService) MarkAsRead(ctx context.Context, callerID, notificationID string) error {
	// MarkAsRead in the repo checks that the notification belongs to callerID,
	// so no extra ownership check is needed here.
	return s.repo.MarkAsRead(ctx, notificationID, callerID)
}
