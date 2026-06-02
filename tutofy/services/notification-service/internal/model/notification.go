package model

import "time"

// NotificationType identifies what kind of event triggered the notification.
type NotificationType int32

const (
	NotificationTypeUnspecified       NotificationType = 0
	NotificationTypeGrade             NotificationType = 1
	NotificationTypeEnrollment        NotificationType = 2
	NotificationTypeNewLesson         NotificationType = 3
	NotificationTypeNewMessage        NotificationType = 4
	NotificationTypeAssignment        NotificationType = 5
	NotificationTypeCourseDone        NotificationType = 6
	NotificationTypeLessonReminder    NotificationType = 7
	NotificationTypeBookingRequest    NotificationType = 8
	NotificationTypeBookingConfirmed  NotificationType = 9
	NotificationTypeBookingDeclined   NotificationType = 10
	NotificationTypeEnrollmentApproved NotificationType = 11
	NotificationTypeEnrollmentRejected NotificationType = 12
	NotificationTypeTutorApproved      NotificationType = 13
	NotificationTypeTutorRejected      NotificationType = 14
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
