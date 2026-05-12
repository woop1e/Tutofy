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
}
