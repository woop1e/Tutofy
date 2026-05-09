package model

import "time"

// FileType identifies what kind of file was uploaded.
type FileType int32

const (
	FileTypeUnspecified    FileType = 0
	FileTypeAssignment     FileType = 1
	FileTypeCourseMaterial FileType = 2
)

// MediaFile holds metadata about an uploaded file
// the actual bytes live in S3/MinIO under S3Key
type MediaFile struct {
	ID         string
	CourseID   string
	UploaderID string
	FileName   string
	S3Key      string // e.g. "courses/course-123/assignment/uuid.pdf"
	FileType   FileType
	CreatedAt  time.Time
}
