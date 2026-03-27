package service

import (
	"context"
	"errors"

	"course-service/proto/coursepb"
	"enrollment-service/internal/model"
	"enrollment-service/internal/repository"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var (
	ErrForbidden  = errors.New("forbidden")
	ErrNotStudent = errors.New("only students can enroll")
)

type EnrollmentService interface {
	EnrollUser(ctx context.Context, callerID, callerRole, courseID string) (*model.Enrollment, error)
	GetUserEnrollments(ctx context.Context, userID string) ([]*model.Enrollment, error)
	GetCourseEnrollments(ctx context.Context, callerRole, courseID string) ([]*model.Enrollment, error)
}

type enrollmentService struct {
	repo         repository.EnrollmentRepository
	courseClient coursepb.CourseServiceClient
}

func NewEnrollmentService(repo repository.EnrollmentRepository, courseClient coursepb.CourseServiceClient) EnrollmentService {
	return &enrollmentService{repo: repo, courseClient: courseClient}
}

func (s *enrollmentService) EnrollUser(ctx context.Context, callerID, callerRole, courseID string) (*model.Enrollment, error) {
	if callerRole != "student" {
		return nil, ErrNotStudent
	}

	// Forward incoming metadata (authorization token) to course-service
	md, _ := metadata.FromIncomingContext(ctx)
	outCtx := metadata.NewOutgoingContext(ctx, md)

	_, err := s.courseClient.GetCourse(outCtx, &coursepb.GetCourseRequest{CourseId: courseID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			return nil, errors.New("course not found")
		}
		return nil, errors.New("course service unavailable: " + st.Message())
	}

	e := &model.Enrollment{
		ID:       uuid.NewString(),
		UserID:   callerID,
		CourseID: courseID,
	}

	if err := s.repo.CreateEnrollment(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *enrollmentService) GetUserEnrollments(ctx context.Context, userID string) ([]*model.Enrollment, error) {
	return s.repo.GetEnrollmentsByUser(ctx, userID)
}

func (s *enrollmentService) GetCourseEnrollments(ctx context.Context, callerRole, courseID string) ([]*model.Enrollment, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetEnrollmentsByCourse(ctx, courseID)
}
