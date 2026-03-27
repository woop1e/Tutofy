package service

import (
	"context"
	"errors"

	"assignment-service/internal/model"
	"assignment-service/internal/repository"
	"course-service/proto/coursepb"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var (
	ErrForbidden = errors.New("forbidden")
	ErrNotTutor  = errors.New("only tutors can create assignments")
)

type AssignmentService interface {
	CreateAssignment(ctx context.Context, callerID, callerRole, title, description, courseID string) (*model.Assignment, error)
	GetAssignmentsByCourse(ctx context.Context, courseID string) ([]*model.Assignment, error)
	DeleteAssignment(ctx context.Context, callerRole, assignmentID string) error
}

type assignmentService struct {
	repo         repository.AssignmentRepository
	courseClient coursepb.CourseServiceClient
}

func NewAssignmentService(repo repository.AssignmentRepository, courseClient coursepb.CourseServiceClient) AssignmentService {
	return &assignmentService{repo: repo, courseClient: courseClient}
}

func (s *assignmentService) CreateAssignment(ctx context.Context, callerID, callerRole, title, description, courseID string) (*model.Assignment, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutor
	}

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

	a := &model.Assignment{
		ID:          uuid.NewString(),
		Title:       title,
		Description: description,
		CourseID:    courseID,
	}

	if err := s.repo.CreateAssignment(ctx, a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *assignmentService) GetAssignmentsByCourse(ctx context.Context, courseID string) ([]*model.Assignment, error) {
	return s.repo.GetByCourseID(ctx, courseID)
}

func (s *assignmentService) DeleteAssignment(ctx context.Context, callerRole, assignmentID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrForbidden
	}
	return s.repo.DeleteAssignment(ctx, assignmentID)
}
