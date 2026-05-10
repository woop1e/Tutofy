package model

import "time"

type SubmissionStatus string

const (
	StatusSubmitted SubmissionStatus = "submitted"
	StatusLate      SubmissionStatus = "late"
	StatusGraded    SubmissionStatus = "graded"
)

type Submission struct {
	ID           string
	AssignmentID string
	StudentID    string
	Content      string
	FileID       string
	Status       SubmissionStatus
	SubmittedAt  time.Time
}
