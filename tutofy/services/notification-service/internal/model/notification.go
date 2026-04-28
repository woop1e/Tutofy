package model

import "time"

// NotificationType identifies what kind of event triggered the notification.
type NotificationType int32

const (
	NotificationTypeUnspecified NotificationType = 0
	NotificationTypeGrade       NotificationType = 1
)

// Notification is a single in-app notification stored for a user.
type Notification struct {
	ID        string
	UserID    string
	Type      NotificationType
	Message   string
	IsRead    bool
	CreatedAt time.Time
}
