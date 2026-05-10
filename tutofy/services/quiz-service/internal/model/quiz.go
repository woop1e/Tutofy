package model

import "time"

type Quiz struct {
	ID        string
	CourseID  string
	Title     string
	CreatedAt time.Time
}

type Question struct {
	ID       string
	QuizID   string
	Text     string
	Position int
	Options  []*Option
}

type Option struct {
	ID         string
	QuestionID string
	Text       string
	IsCorrect  bool
}

type QuizAttempt struct {
	ID          string
	QuizID      string
	StudentID   string
	Score       int
	Total       int
	StartedAt   time.Time
	CompletedAt *time.Time
}

type AttemptAnswer struct {
	AttemptID  string
	QuestionID string
	OptionID   string
}
