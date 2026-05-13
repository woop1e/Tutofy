package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"lesson-service/internal/client"
	"lesson-service/internal/model"
	"lesson-service/internal/repository"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
)

type lessonStatusEvent struct {
	CourseID   string   `json:"course_id"`
	LessonID   string   `json:"lesson_id"`
	StudentIDs []string `json:"student_ids"`
	Status     string   `json:"status"`
}

var statusName = map[model.LessonStatus]string{
	model.LessonStatusPlanned:   "PLANNED",
	model.LessonStatusCompleted: "COMPLETED",
	model.LessonStatusCancelled: "CANCELLED",
}

var (
	ErrForbidden       = errors.New("forbidden")
	ErrNotTutorOrAdmin = errors.New("only tutors and admins can perform this action")
	ErrNotEnrolled     = errors.New("student is not enrolled in this course")
)

// LessonService is the business-logic contract.
type LessonService interface {
	CreateLesson(ctx context.Context, callerID, callerRole, courseID, title, videoLink string, scheduledAt time.Time, durationMinutes int32) (*model.Lesson, error)
	GetLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string, limit, offset int32) ([]*model.Lesson, error)
	UpdateLessonStatus(ctx context.Context, callerID, callerRole, lessonID string, status model.LessonStatus) (*model.Lesson, error)
	DeleteLesson(ctx context.Context, callerID, callerRole, lessonID string) error
	MarkAttendance(ctx context.Context, callerID, callerRole, lessonID string, studentIDs []string, attended bool) error
	GetMySchedule(ctx context.Context, callerID, callerRole, fromDate, toDate string) ([]*model.Lesson, error)
	AddMaterial(ctx context.Context, callerID, callerRole, lessonID, fileID, title string) error
	GetLessonMaterials(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.LessonMaterial, error)
	GetAttendance(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.AttendanceRow, error)
}

type lessonService struct {
	repo       repository.LessonRepository
	enrollment client.EnrollmentClient
	course     client.CourseClient
	nc         *nats.Conn
}

// NewLessonService creates a LessonService wired to all required dependencies.
func NewLessonService(
	repo repository.LessonRepository,
	enrollment client.EnrollmentClient,
	course client.CourseClient,
	nc *nats.Conn,
) LessonService {
	return &lessonService{
		repo:       repo,
		enrollment: enrollment,
		course:     course,
		nc:         nc,
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

	if err := s.course.CourseExists(ctx, courseID); err != nil {
		return nil, err
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

func (s *lessonService) GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string, limit, offset int32) ([]*model.Lesson, error) {
	if err := s.assertCanView(ctx, callerID, callerRole, courseID); err != nil {
		return nil, err
	}
	return s.repo.GetCourseLessons(ctx, courseID, limit, offset)
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

// notifyProgress publishes a lesson.status_changed event to NATS with all
// enrolled student IDs included so progress-service can process without
// needing its own enrollment-service client.
func (s *lessonService) notifyProgress(ctx context.Context, courseID, lessonID string, status model.LessonStatus) {
	if s.nc == nil {
		return
	}
	studentIDs, err := s.enrollment.GetEnrolledStudentIDs(ctx, courseID)
	if err != nil || len(studentIDs) == 0 {
		return
	}
	ev := lessonStatusEvent{
		CourseID:   courseID,
		LessonID:   lessonID,
		StudentIDs: studentIDs,
		Status:     statusName[status],
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if err := s.nc.Publish("lesson.status_changed", data); err != nil {
		log.Printf("warn: NATS publish lesson.status_changed failed: %v", err)
	}
}

func isTutorOrAdmin(role string) bool {
	return role == "tutor" || role == "admin"
}

func (s *lessonService) MarkAttendance(ctx context.Context, callerID, callerRole, lessonID string, studentIDs []string, attended bool) error {
	if !isTutorOrAdmin(callerRole) {
		return ErrNotTutorOrAdmin
	}
	// Verify the caller owns this lesson (or is admin).
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}
	for _, studentID := range studentIDs {
		if err := s.repo.UpsertAttendance(ctx, lessonID, studentID, attended); err != nil {
			return err
		}
	}
	return nil
}

func (s *lessonService) GetMySchedule(ctx context.Context, callerID, callerRole, fromDate, toDate string) ([]*model.Lesson, error) {
	var courseIDs []string
	var tutorID string

	switch callerRole {
	case "tutor", "admin":
		tutorID = callerID
	case "student":
		ids, err := s.enrollment.GetEnrolledCourseIDs(ctx, callerID)
		if err != nil {
			return nil, err
		}
		courseIDs = ids
	default:
		return nil, ErrForbidden
	}

	return s.repo.GetLessonsInRange(ctx, courseIDs, tutorID, fromDate, toDate)
}

func (s *lessonService) AddMaterial(ctx context.Context, callerID, callerRole, lessonID, fileID, title string) error {
	if !isTutorOrAdmin(callerRole) {
		return ErrNotTutorOrAdmin
	}
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}
	id := uuid.NewString()
	return s.repo.AddMaterial(ctx, id, lessonID, fileID, title)
}

func (s *lessonService) GetLessonMaterials(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.LessonMaterial, error) {
	return s.repo.GetLessonMaterials(ctx, lessonID)
}


func (s *lessonService) GetAttendance(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.AttendanceRow, error) {
	return s.repo.GetAttendance(ctx, lessonID, callerID, callerRole)
}
