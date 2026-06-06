package model

import "time"

// LessonStatus represents the lifecycle state of a lesson.
type LessonStatus int32

const (
	LessonStatusUnspecified         LessonStatus = 0
	LessonStatusPlanned             LessonStatus = 1
	LessonStatusCompleted           LessonStatus = 2
	LessonStatusCancelled           LessonStatus = 3
	LessonStatusPendingConfirmation LessonStatus = 4 // waiting for tutor to accept
	LessonStatusAwaitingPayment     LessonStatus = 5 // tutor accepted, waiting for student payment
	LessonStatusPaymentExpired      LessonStatus = 6 // payment deadline passed without payment
)

// Lesson represents a single scheduled session within a course.
type Lesson struct {
	ID              string
	CourseID        string
	TutorID         string
	StudentID       string // set for individual (non-course) lessons
	Title           string
	Description     string
	ScheduledAt     time.Time
	DurationMinutes int32
	VideoLink       string
	Status          LessonStatus
	Price           float64 // price for individual lessons; 0 for course lessons
	PaymentDeadline time.Time
	CalendarEventID string
	StudentRating   int32 // 0 = not rated, 1-5 = star rating from student
}
