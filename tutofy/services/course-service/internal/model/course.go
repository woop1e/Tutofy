package model

type Course struct {
	ID                  string
	Title               string
	Description         string
	TutorID             string
	Price               float64
	CourseType          string // "group" or "individual"
	MaxStudents         int32
	EnrollmentDeadline  string // RFC3339 or empty
	IsPublished         bool
	TotalLessons        int32  // planned total lessons for the full course (0 = not set)
	TotalWeeks          int32  // planned duration in weeks (0 = not set)
	ReleaseType         string // "static" | "scheduled" | "live"
	StartDate           string // RFC3339 or empty
	EndDate             string // RFC3339 or empty
}
