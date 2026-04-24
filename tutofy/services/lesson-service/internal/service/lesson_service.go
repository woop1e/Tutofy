package service

import (
	"context"
	"errors"
	"time"

	"lesson-service/internal/client"
	"lesson-service/internal/model"
	"lesson-service/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrForbidden       = errors.New("forbidden")
	ErrNotTutorOrAdmin = errors.New("only tutors and admins can perform this action")
	ErrNotEnrolled     = errors.New("student is not enrolled in this course")
)

// LessonService is the business-logic contract.
type LessonService interface {
	CreateLesson(ctx context.Context, callerID, callerRole, courseID, title, videoLink string, scheduledAt time.Time, durationMinutes int32) (*model.Lesson, error)
	GetLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string) ([]*model.Lesson, error)
	UpdateLessonStatus(ctx context.Context, callerID, callerRole, lessonID string, status model.LessonStatus) (*model.Lesson, error)
	DeleteLesson(ctx context.Context, callerID, callerRole, lessonID string) error
}

type lessonService struct {
	repo       repository.LessonRepository
	enrollment client.EnrollmentClient
	progress   client.ProgressClient
}

// NewLessonService creates a LessonService wired to all required dependencies.
func NewLessonService(
	repo repository.LessonRepository,
	enrollment client.EnrollmentClient,
	progress client.ProgressClient,
) LessonService {
	return &lessonService{
		repo:       repo,
		enrollment: enrollment,
		progress:   progress,
	}
}

func (s *lessonService) CreateLesson(
	ctx context.Context,
	callerID, callerRole, courseID, title, videoLink string,
	scheduledAt time.Time,
	durationMinutes int32,
) (*model.Lesson, error) {
	if !isTutorOrAdmin(callerRole) {
		return nil, ErrNotTutorOrAdmin
	}

	lesson := &model.Lesson{
		ID:              uuid.NewString(),
		CourseID:        courseID,
		TutorID:         callerID,
		Title:           title,
		ScheduledAt:     scheduledAt,
		DurationMinutes: durationMinutes,
		VideoLink:       videoLink,
		Status:          model.LessonStatusPlanned,
	}

	if err := s.repo.CreateLesson(ctx, lesson); err != nil {
		return nil, err
	}

	// Notify progress-service for all enrolled students.
	go s.notifyProgress(ctx, lesson.CourseID, lesson.ID, model.LessonStatusPlanned)

	return lesson, nil
}

func (s *lessonService) GetLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	if err := s.assertCanView(ctx, callerID, callerRole, lesson.CourseID); err != nil {
		return nil, err
	}

	return lesson, nil
}

func (s *lessonService) GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string) ([]*model.Lesson, error) {
	if err := s.assertCanView(ctx, callerID, callerRole, courseID); err != nil {
		return nil, err
	}
	return s.repo.GetCourseLessons(ctx, courseID)
}

func (s *lessonService) UpdateLessonStatus(
	ctx context.Context,
	callerID, callerRole, lessonID string,
	status model.LessonStatus,
) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	// Only the tutor who created the lesson or an admin may change its status.
	if callerRole != "admin" && lesson.TutorID != callerID {
		return nil, ErrForbidden
	}

	updated, err := s.repo.UpdateLessonStatus(ctx, lessonID, status)
	if err != nil {
		return nil, err
	}

	// Notify progress-service for all enrolled students.
	go s.notifyProgress(ctx, updated.CourseID, updated.ID, status)

	return updated, nil
}

func (s *lessonService) DeleteLesson(ctx context.Context, callerID, callerRole, lessonID string) error {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}

	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}

	return s.repo.DeleteLesson(ctx, lessonID)
}

// --- helpers ---

// assertCanView checks whether the caller is allowed to view lessons in a course.
// Tutors, admins and parents can always view. Students must be enrolled.
func (s *lessonService) assertCanView(ctx context.Context, callerID, callerRole, courseID string) error {
	switch callerRole {
	case "tutor", "admin", "parent":
		return nil
	case "student":
		enrolled, err := s.enrollment.IsEnrolled(ctx, callerID, courseID)
		if err != nil {
			return err
		}
		if !enrolled {
			return ErrNotEnrolled
		}
		return nil
	default:
		return ErrForbidden
	}
}

// notifyProgress fetches all enrolled students and fires RecordLessonEvent
// for each of them. Runs in a goroutine so it never blocks the main flow.
func (s *lessonService) notifyProgress(ctx context.Context, courseID, lessonID string, status model.LessonStatus) {
	studentIDs, err := s.enrollment.GetEnrolledStudentIDs(ctx, courseID)
	if err != nil {
		return
	}
	s.progress.RecordLessonEvent(ctx, studentIDs, courseID, lessonID, status)
}

func isTutorOrAdmin(role string) bool {
	return role == "tutor" || role == "admin"
}
