package model

type Grade struct {
	ID           string
	AssignmentID string
	StudentID    string
	Grade        float32
	Feedback     string
}
