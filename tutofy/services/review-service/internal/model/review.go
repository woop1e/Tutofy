package model

import "time"

type Review struct {
	ID        string
	CourseID  string
	StudentID string
	Rating    int32
	Body      string
	CreatedAt time.Time
}

type CourseRating struct {
	Average float64
	Count   int64
}
