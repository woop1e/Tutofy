package model

import "time"

type Enrollment struct {
	ID       string
	UserID   string
	CourseID string
}

// EnrollmentRequest represents a student's request to join a course before payment.
type EnrollmentRequest struct {
	ID        string
	UserID    string
	CourseID  string
	Status    string // pending | approved | rejected
	CreatedAt time.Time
}
