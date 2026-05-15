package model

import "time"

// LessonStatus represents the lifecycle state of a lesson.
type LessonStatus int32

const (
	LessonStatusUnspecified LessonStatus = 0
	LessonStatusPlanned     LessonStatus = 1
	LessonStatusCompleted   LessonStatus = 2
	LessonStatusCancelled   LessonStatus = 3
)

// Lesson represents a single scheduled session within a course.
type Lesson struct {
	ID              string
	CourseID        string
	TutorID         string
	StudentID       string // set for individual (non-course) lessons
	Title           string
	ScheduledAt     time.Time
	DurationMinutes int32
	VideoLink       string
	Status          LessonStatus
}
