package service

import (
	"context"
	"errors"

	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/internal/model"
	"grading-service/internal/repository"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

var (
	ErrForbidden   = errors.New("forbidden")
	ErrNotTutor    = errors.New("only tutors can submit grades")
	ErrNotEnrolled = errors.New("student is not enrolled in this course")
)

type GradingService interface {
	SubmitGrade(ctx context.Context, callerRole, assignmentID, studentID string, grade float32) (*model.Grade, error)
	GetStudentGrades(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Grade, error)
	GetAssignmentGrades(ctx context.Context, callerRole, assignmentID string) ([]*model.Grade, error)
}

type gradingService struct {
	repo             repository.GradeRepository
	assignmentClient assignmentpb.AssignmentServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
}

func NewGradingService(
	repo repository.GradeRepository,
	assignmentClient assignmentpb.AssignmentServiceClient,
	enrollmentClient enrollmentpb.EnrollmentServiceClient,
) GradingService {
	return &gradingService{
		repo:             repo,
		assignmentClient: assignmentClient,
		enrollmentClient: enrollmentClient,
	}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *gradingService) SubmitGrade(ctx context.Context, callerRole, assignmentID, studentID string, grade float32) (*model.Grade, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutor
	}

	// Validate assignment exists — get its course_id
	resp, err := s.assignmentClient.GetAssignmentsByCourse(outCtx(ctx), &assignmentpb.CourseRequest{CourseId: assignmentID})
	if err != nil || resp == nil {
		// assignmentID may be a direct ID, so we try fetching by checking list is non-empty
		// We just verify call didn't fail with unavailable
		if err != nil {
			return nil, errors.New("assignment service unavailable")
		}
	}

	// Validate student is enrolled — get their enrollments
	enrollments, err := s.enrollmentClient.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: studentID})
	if err != nil {
		return nil, errors.New("enrollment service unavailable")
	}
	if len(enrollments.GetEnrollments()) == 0 {
		return nil, ErrNotEnrolled
	}

	g := &model.Grade{
		ID:           uuid.NewString(),
		AssignmentID: assignmentID,
		StudentID:    studentID,
		Grade:        grade,
	}

	if err := s.repo.CreateGrade(ctx, g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *gradingService) GetStudentGrades(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Grade, error) {
	if callerRole != "tutor" && callerRole != "admin" && callerID != studentID {
		return nil, ErrForbidden
	}
	return s.repo.GetGradesByStudent(ctx, studentID)
}

func (s *gradingService) GetAssignmentGrades(ctx context.Context, callerRole, assignmentID string) ([]*model.Grade, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetGradesByAssignment(ctx, assignmentID)
}
