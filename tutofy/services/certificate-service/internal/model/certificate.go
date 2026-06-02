package model

import "time"

type CertStatus int32

const (
	CertStatusPending  CertStatus = 0
	CertStatusApproved CertStatus = 1
	CertStatusRejected CertStatus = 2
)

type Certificate struct {
	ID          string
	StudentID   string
	CourseID    string
	TutorID     string
	Status      CertStatus
	IssuedAt    time.Time
	StudentName string
	CourseName  string
	TutorName   string
}
