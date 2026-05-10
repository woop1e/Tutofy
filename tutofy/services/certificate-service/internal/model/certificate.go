package model

import "time"

type Certificate struct {
	ID        string
	StudentID string
	CourseID  string
	IssuedAt  time.Time
}
