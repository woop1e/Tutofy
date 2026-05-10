package service

import (
	"context"
	"errors"
	"time"

	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"submission-service/internal/model"
	"submission-service/internal/repository"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var (
	ErrForbidden   = errors.New("forbidden")
	ErrNotStudent  = errors.New("only students can submit assignments")
	ErrNotEnrolled = errors.New("not enrolled in this course")
)

type SubmissionService interface {
	SubmitAssignment(ctx context.Context, callerID, callerRole, assignmentID, content, fileID string) (*model.Submission, error)
	GetSubmission(ctx context.Context, callerID, callerRole, assignmentID, studentID string) (*model.Submission, error)
	GetAssignmentSubmissions(ctx context.Context, callerRole, assignmentID string, limit, offset int32) ([]*model.Submission, error)
	MarkGraded(ctx context.Context, callerRole, assignmentID, studentID string) (*model.Submission, error)
}

type submissionService struct {
	repo             repository.SubmissionRepository
	assignmentClient assignmentpb.AssignmentServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
}

func NewSubmissionService(
	repo repository.SubmissionRepository,
	assignmentClient assignmentpb.AssignmentServiceClient,
	enrollmentClient enrollmentpb.EnrollmentServiceClient,
) SubmissionService {
	return &submissionService{repo: repo, assignmentClient: assignmentClient, enrollmentClient: enrollmentClient}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *submissionService) SubmitAssignment(ctx context.Context, callerID, callerRole, assignmentID, content, fileID string) (*model.Submission, error) {
	if callerRole != "student" {
		return nil, ErrNotStudent
	}

	// Verify assignment exists.
	aResp, err := s.assignmentClient.GetAssignment(outCtx(ctx), &assignmentpb.GetAssignmentRequest{AssignmentId: assignmentID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			return nil, errors.New("assignment not found")
		}
		return nil, errors.New("assignment service unavailable")
	}

	// Verify student is enrolled in the course.
	enrollments, err := s.enrollmentClient.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: callerID})
	if err != nil {
		return nil, errors.New("enrollment service unavailable")
	}
	enrolled := false
	for _, e := range enrollments.GetEnrollments() {
		if e.GetCourseId() == aResp.GetCourseId() {
			enrolled = true
			break
		}
	}
	if !enrolled {
		return nil, ErrNotEnrolled
	}

	sub := &model.Submission{
		ID:           uuid.NewString(),
		AssignmentID: assignmentID,
		StudentID:    callerID,
		Content:      content,
		FileID:       fileID,
		Status:       model.StatusSubmitted,
		SubmittedAt:  time.Now(),
	}
	if err := s.repo.Create(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *submissionService) GetSubmission(ctx context.Context, callerID, callerRole, assignmentID, studentID string) (*model.Submission, error) {
	if callerRole == "student" && callerID != studentID {
		return nil, ErrForbidden
	}
	return s.repo.GetByAssignmentAndStudent(ctx, assignmentID, studentID)
}

func (s *submissionService) GetAssignmentSubmissions(ctx context.Context, callerRole, assignmentID string, limit, offset int32) ([]*model.Submission, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	if limit <= 0 {
		limit = 50
	}
	return s.repo.GetByAssignment(ctx, assignmentID, limit, offset)
}

func (s *submissionService) MarkGraded(ctx context.Context, callerRole, assignmentID, studentID string) (*model.Submission, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.UpdateStatus(ctx, assignmentID, studentID, model.StatusGraded)
}
