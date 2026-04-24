package service

import (
	"context"
	"errors"

	"progress-service/internal/model"
	"progress-service/internal/repository"
)

var (
	ErrForbidden = errors.New("forbidden")
)

// ProgressService is the business-logic contract for progress tracking.
type ProgressService interface {
	// RecordLessonEvent is called by lesson-service when a lesson status changes.
	RecordLessonEvent(ctx context.Context, studentID, courseID, lessonID string, status model.LessonStatus) error

	// GetProgress returns the progress for a student in a course.
	// The caller must be the student themselves, a tutor, a parent, or an admin.
	GetProgress(ctx context.Context, callerID, callerRole, studentID, courseID string) (*model.Progress, error)

	// GetCourseProgress returns progress for all students in a course.
	// The caller must be a tutor, parent, or admin.
	GetCourseProgress(ctx context.Context, callerID, callerRole, courseID string) ([]*model.Progress, error)
}

type progressService struct {
	repo repository.ProgressRepository
}

// NewProgressService creates a ProgressService backed by the given repository.
func NewProgressService(repo repository.ProgressRepository) ProgressService {
	return &progressService{repo: repo}
}

func (s *progressService) RecordLessonEvent(
	ctx context.Context,
	studentID, courseID, lessonID string,
	status model.LessonStatus,
) error {
	return s.repo.UpsertLessonEvent(ctx, studentID, courseID, lessonID, status)
}

func (s *progressService) GetProgress(
	ctx context.Context,
	callerID, callerRole, studentID, courseID string,
) (*model.Progress, error) {
	if !canReadStudentProgress(callerID, callerRole, studentID) {
		return nil, ErrForbidden
	}
	return s.repo.GetProgress(ctx, studentID, courseID)
}

func (s *progressService) GetCourseProgress(
	ctx context.Context,
	callerID, callerRole, courseID string,
) ([]*model.Progress, error) {
	if !canReadCourseProgress(callerRole) {
		return nil, ErrForbidden
	}
	return s.repo.GetCourseProgress(ctx, courseID)
}

// canReadStudentProgress returns true when the caller is allowed to view
// a specific student's progress.
// Allowed: the student themselves, tutors, parents, admins.
func canReadStudentProgress(callerID, callerRole, studentID string) bool {
	if callerID == studentID {
		return true
	}
	switch callerRole {
	case "tutor", "parent", "admin":
		return true
	}
	return false
}

// canReadCourseProgress returns true for roles that may read all students'
// progress in a course.
func canReadCourseProgress(callerRole string) bool {
	switch callerRole {
	case "tutor", "parent", "admin":
		return true
	}
	return false
}
