package model

// Progress holds the aggregated lesson counts for a student in one course.
type Progress struct {
	StudentID        string
	CourseID         string
	CompletedLessons int
	CancelledLessons int
	PlannedLessons   int
}

// Total returns the total number of lessons across all statuses.
func (p *Progress) Total() int {
	return p.CompletedLessons + p.CancelledLessons + p.PlannedLessons
}

// CompletionPct returns the percentage of lessons completed out of all known lessons.
// Returns 0 if there are no lessons yet.
func (p *Progress) CompletionPct() float32 {
	total := p.Total()
	if total == 0 {
		return 0
	}
	return float32(p.CompletedLessons) / float32(total) * 100
}

// LessonStatus represents the status of a single lesson event.
type LessonStatus int32

const (
	LessonStatusUnspecified LessonStatus = 0
	LessonStatusPlanned     LessonStatus = 1
	LessonStatusCompleted   LessonStatus = 2
	LessonStatusCancelled   LessonStatus = 3
)
