package model

import "time"

type PaymentStatus string

const (
	StatusPending   PaymentStatus = "pending"
	StatusCompleted PaymentStatus = "completed"
	StatusFailed    PaymentStatus = "failed"
	StatusRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID        string
	UserID    string
	CourseID  string
	LessonID  string // set for individual lesson payments; empty for course payments
	Amount    float64
	Status    PaymentStatus
	CreatedAt time.Time
}
