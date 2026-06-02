package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"course-service/internal/model"
	"course-service/internal/repository"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	ErrForbidden = errors.New("forbidden")
	ErrNotTutor  = errors.New("only tutors can create courses")
)

type CourseService interface {
	CreateCourse(ctx context.Context, callerID, callerRole, title, description string, price float64, courseType string, maxStudents int32, enrollmentDeadline string, totalLessons, totalWeeks int32, releaseType, startDate, endDate string) (*model.Course, error)
	GetCourse(ctx context.Context, id string) (*model.Course, error)
	GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error)
	UpdateCourse(ctx context.Context, callerID, callerRole, courseID, title, description, courseType string, price float64, maxStudents int32, enrollmentDeadline string, totalLessons, totalWeeks int32, releaseType, startDate, endDate string) (*model.Course, error)
	PublishCourse(ctx context.Context, callerID, callerRole, courseID string) (*model.Course, error)
	SearchCourses(ctx context.Context, tutorID, tag, courseType string, minPrice, maxPrice float64, limit, offset int32) ([]*model.Course, error)
	DeleteCourse(ctx context.Context, callerID, callerRole, courseID string) error
	AddTag(ctx context.Context, callerID, callerRole, courseID, tagName string) error
	RemoveTag(ctx context.Context, callerID, callerRole, courseID, tagName string) error
	GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error)
}

type courseService struct {
	repo repository.CourseRepository
	rdb  *redis.Client
}

func NewCourseService(repo repository.CourseRepository, rdb *redis.Client) CourseService {
	return &courseService{repo: repo, rdb: rdb}
}

func (s *courseService) CreateCourse(ctx context.Context, callerID, callerRole, title, description string, price float64, courseType string, maxStudents int32, enrollmentDeadline string, totalLessons, totalWeeks int32, releaseType, startDate, endDate string) (*model.Course, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutor
	}
	if courseType == "" {
		courseType = "group"
	}
	if releaseType == "" {
		releaseType = "static"
	}
	course := &model.Course{
		ID:                 uuid.NewString(),
		Title:              title,
		Description:        description,
		TutorID:            callerID,
		Price:              price,
		CourseType:         courseType,
		MaxStudents:        maxStudents,
		EnrollmentDeadline: enrollmentDeadline,
		TotalLessons:       totalLessons,
		TotalWeeks:         totalWeeks,
		ReleaseType:        releaseType,
		StartDate:          startDate,
		EndDate:            endDate,
	}
	if err := s.repo.CreateCourse(ctx, course); err != nil {
		return nil, err
	}
	return course, nil
}

func (s *courseService) GetCourse(ctx context.Context, id string) (*model.Course, error) {
	if s.rdb != nil {
		if val, err := s.rdb.Get(ctx, "course:"+id).Result(); err == nil {
			var c model.Course
			if json.Unmarshal([]byte(val), &c) == nil {
				return &c, nil
			}
		}
	}
	c, err := s.repo.GetCourseByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.rdb != nil {
		if data, e := json.Marshal(c); e == nil {
			_ = s.rdb.SetEx(ctx, "course:"+id, string(data), 30*time.Second).Err()
		}
	}
	return c, nil
}

func (s *courseService) GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error) {
	return s.repo.GetAllCourses(ctx, limit, offset)
}

func (s *courseService) UpdateCourse(ctx context.Context, callerID, callerRole, courseID, title, description, courseType string, price float64, maxStudents int32, enrollmentDeadline string, totalLessons, totalWeeks int32, releaseType, startDate, endDate string) (*model.Course, error) {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && course.TutorID != callerID {
		return nil, ErrForbidden
	}
	if courseType == "" {
		courseType = course.CourseType
	}
	if releaseType == "" {
		releaseType = course.ReleaseType
	}
	updated, err := s.repo.UpdateCourse(ctx, courseID, title, description, courseType, price, maxStudents, enrollmentDeadline, totalLessons, totalWeeks, releaseType, startDate, endDate)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "course:"+courseID).Err()
	}
	return updated, err
}

func (s *courseService) PublishCourse(ctx context.Context, callerID, callerRole, courseID string) (*model.Course, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	c, err := s.repo.PublishCourse(ctx, courseID, callerID, callerRole)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "course:"+courseID).Err()
	}
	return c, err
}

func (s *courseService) DeleteCourse(ctx context.Context, callerID, callerRole, courseID string) error {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && course.TutorID != callerID {
		return ErrForbidden
	}
	err = s.repo.DeleteCourse(ctx, courseID)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "course:"+courseID).Err()
	}
	return err
}

func (s *courseService) AddTag(ctx context.Context, callerID, callerRole, courseID, tagName string) error {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && course.TutorID != callerID {
		return ErrForbidden
	}
	tagID, err := s.repo.EnsureTag(ctx, uuid.NewString(), tagName)
	if err != nil {
		return err
	}
	return s.repo.AddCourseTag(ctx, courseID, tagID)
}

func (s *courseService) RemoveTag(ctx context.Context, callerID, callerRole, courseID, tagName string) error {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && course.TutorID != callerID {
		return ErrForbidden
	}
	return s.repo.RemoveCourseTag(ctx, courseID, tagName)
}

func (s *courseService) GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.GetCoursesByTag(ctx, tagName, limit, offset)
}

func (s *courseService) SearchCourses(ctx context.Context, tutorID, tag, courseType string, minPrice, maxPrice float64, limit, offset int32) ([]*model.Course, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.SearchCourses(ctx, tutorID, tag, courseType, minPrice, maxPrice, limit, offset)
}
