package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"media-service/internal/client"
	"media-service/internal/model"
	"media-service/internal/repository"
	"media-service/internal/storage"

	"github.com/google/uuid"
)

var (
	ErrForbidden   = errors.New("forbidden")
	ErrNotEnrolled = errors.New("not enrolled in this course")
)

// MediaService is the business-logic contract.
type MediaService interface {
	// UploadFile stores a file in S3 and saves metadata.
	// Tutors/admins upload course materials; students upload assignment files.
	UploadFile(ctx context.Context, callerID, callerRole, courseID, fileName string, fileType model.FileType, data []byte) (*model.MediaFile, error)

	// GetDownloadURL returns a presigned URL for a file.
	// Caller must be enrolled in the course, or be a tutor/admin/parent.
	GetDownloadURL(ctx context.Context, callerID, callerRole, fileID string) (url string, fileName string, err error)

	// DeleteFile removes a file from S3 and the database.
	// Only the uploader or an admin may delete.
	DeleteFile(ctx context.Context, callerID, callerRole, fileID string) error
}

type mediaService struct {
	repo       repository.MediaRepository
	storage    *storage.Client
	enrollment client.EnrollmentClient
}

// NewMediaService creates a MediaService wired to all required dependencies.
func NewMediaService(
	repo repository.MediaRepository,
	storage *storage.Client,
	enrollment client.EnrollmentClient,
) MediaService {
	return &mediaService{
		repo:       repo,
		storage:    storage,
		enrollment: enrollment,
	}
}

func (s *mediaService) UploadFile(
	ctx context.Context,
	callerID, callerRole, courseID, fileName string,
	fileType model.FileType,
	data []byte,
) (*model.MediaFile, error) {
	switch fileType {
	case model.FileTypeCourseMaterial:
		if callerRole != "tutor" && callerRole != "admin" {
			return nil, ErrForbidden
		}
	case model.FileTypeAssignment:
		if callerID == "" {
			return nil, ErrForbidden
		}
		if callerRole == "student" && courseID != "" {
			enrolled, err := s.enrollment.IsEnrolled(ctx, callerID, courseID)
			if err != nil {
				return nil, err
			}
			if !enrolled {
				return nil, ErrNotEnrolled
			}
		} else if callerRole != "student" && callerRole != "admin" {
			return nil, ErrForbidden
		}
	case model.FileTypeUserDocument:
		if callerID == "" {
			return nil, ErrForbidden
		}
	default:
		return nil, errors.New("unsupported file type")
	}

	fileID := uuid.NewString()
	s3Key := buildS3Key(courseID, fileType, fileID, fileName)
	contentType := detectContentType(fileName)

	if err := s.storage.Upload(ctx, s3Key, data, contentType); err != nil {
		return nil, fmt.Errorf("failed to upload to storage: %w", err)
	}

	f := &model.MediaFile{
		ID:         fileID,
		CourseID:   courseID,
		UploaderID: callerID,
		FileName:   fileName,
		S3Key:      s3Key,
		FileType:   fileType,
		CreatedAt:  time.Now().UTC(),
	}

	if err := s.repo.SaveFile(ctx, f); err != nil {
		// Best-effort cleanup from S3 if DB save fails.
		_ = s.storage.Delete(ctx, s3Key)
		return nil, err
	}

	return f, nil
}

func (s *mediaService) GetDownloadURL(ctx context.Context, callerID, callerRole, fileID string) (string, string, error) {
	f, err := s.repo.GetFileByID(ctx, fileID)
	if err != nil {
		return "", "", err
	}

	// Tutors, admins, and parents can always download.
	// Students must be enrolled in the course the file belongs to.
	switch callerRole {
	case "tutor", "admin", "parent":
		// allowed
	case "student":
		enrolled, err := s.enrollment.IsEnrolled(ctx, callerID, f.CourseID)
		if err != nil {
			return "", "", err
		}
		if !enrolled {
			return "", "", ErrNotEnrolled
		}
	default:
		return "", "", ErrForbidden
	}

	url, err := s.storage.PresignDownload(ctx, f.S3Key, time.Hour)
	if err != nil {
		return "", "", err
	}

	return url, f.FileName, nil
}

func (s *mediaService) DeleteFile(ctx context.Context, callerID, callerRole, fileID string) error {
	f, err := s.repo.GetFileByID(ctx, fileID)
	if err != nil {
		return err
	}

	if callerRole != "admin" && f.UploaderID != callerID {
		return ErrForbidden
	}

	if err := s.storage.Delete(ctx, f.S3Key); err != nil {
		return fmt.Errorf("failed to delete from storage: %w", err)
	}

	return s.repo.DeleteFile(ctx, fileID)
}

// --- helpers ---

// buildS3Key produces a structured path for each file type.
func buildS3Key(courseID string, fileType model.FileType, fileID, fileName string) string {
	switch fileType {
	case model.FileTypeUserDocument:
		return fmt.Sprintf("users/documents/%s_%s", fileID, fileName)
	case model.FileTypeAssignment:
		return fmt.Sprintf("courses/%s/assignments/%s_%s", courseID, fileID, fileName)
	default:
		return fmt.Sprintf("courses/%s/materials/%s_%s", courseID, fileID, fileName)
	}
}

// detectContentType returns a basic MIME type based on file extension.
func detectContentType(fileName string) string {
	ext := ""
	for i := len(fileName) - 1; i >= 0; i-- {
		if fileName[i] == '.' {
			ext = fileName[i:]
			break
		}
	}
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".ppt", ".pptx":
		return "application/vnd.ms-powerpoint"
	default:
		return "application/octet-stream"
	}
}
