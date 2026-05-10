package service

import (
	"context"
	"errors"

	"course-service/internal/model"
	"course-service/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrForbidden = errors.New("forbidden")
	ErrNotTutor  = errors.New("only tutors can create courses")
)

type CourseService interface {
	CreateCourse(ctx context.Context, callerID, callerRole, title, description string) (*model.Course, error)
	GetCourse(ctx context.Context, id string) (*model.Course, error)
	GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error)
	UpdateCourse(ctx context.Context, callerID, callerRole, courseID, title, description string) (*model.Course, error)
	DeleteCourse(ctx context.Context, callerID, callerRole, courseID string) error
}

type courseService struct {
	repo repository.CourseRepository
}

func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{repo: repo}
}

func (s *courseService) CreateCourse(ctx context.Context, callerID, callerRole, title, description string) (*model.Course, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutor
	}

	course := &model.Course{
		ID:          uuid.NewString(),
		Title:       title,
		Description: description,
		TutorID:     callerID,
	}

	if err := s.repo.CreateCourse(ctx, course); err != nil {
		return nil, err
	}
	return course, nil
}

func (s *courseService) GetCourse(ctx context.Context, id string) (*model.Course, error) {
	return s.repo.GetCourseByID(ctx, id)
}

func (s *courseService) GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error) {
	return s.repo.GetAllCourses(ctx, limit, offset)
}

func (s *courseService) UpdateCourse(ctx context.Context, callerID, callerRole, courseID, title, description string) (*model.Course, error) {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && course.TutorID != callerID {
		return nil, ErrForbidden
	}
	return s.repo.UpdateCourse(ctx, courseID, title, description)
}

func (s *courseService) DeleteCourse(ctx context.Context, callerID, callerRole, courseID string) error {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}

	if callerRole != "admin" && course.TutorID != callerID {
		return ErrForbidden
	}

	return s.repo.DeleteCourse(ctx, courseID)
}
