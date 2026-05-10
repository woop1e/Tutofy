package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/internal/model"
	"grading-service/internal/repository"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type gradeEvent struct {
	AssignmentID string  `json:"assignment_id"`
	StudentID    string  `json:"student_id"`
	Grade        float32 `json:"grade"`
	Feedback     string  `json:"feedback"`
}

var (
	ErrForbidden   = errors.New("forbidden")
	ErrNotTutor    = errors.New("only tutors can submit grades")
	ErrNotEnrolled = errors.New("student is not enrolled in this course")
)

type GradingService interface {
	SubmitGrade(ctx context.Context, callerRole, assignmentID, studentID, feedback string, grade float32) (*model.Grade, error)
	GetStudentGrades(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Grade, error)
	GetAssignmentGrades(ctx context.Context, callerRole, assignmentID string) ([]*model.Grade, error)
}

type gradingService struct {
	repo             repository.GradeRepository
	assignmentClient assignmentpb.AssignmentServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
	nc               *nats.Conn
}

func NewGradingService(
	repo repository.GradeRepository,
	assignmentClient assignmentpb.AssignmentServiceClient,
	enrollmentClient enrollmentpb.EnrollmentServiceClient,
	nc *nats.Conn,
) GradingService {
	return &gradingService{
		repo:             repo,
		assignmentClient: assignmentClient,
		enrollmentClient: enrollmentClient,
		nc:               nc,
	}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *gradingService) SubmitGrade(ctx context.Context, callerRole, assignmentID, studentID, feedback string, grade float32) (*model.Grade, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutor
	}

	// Validate assignment exists
	_, err := s.assignmentClient.GetAssignment(outCtx(ctx), &assignmentpb.GetAssignmentRequest{AssignmentId: assignmentID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			return nil, errors.New("assignment not found")
		}
		return nil, errors.New("assignment service unavailable")
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
		Feedback:     feedback,
	}

	if err := s.repo.CreateGrade(ctx, g); err != nil {
		return nil, err
	}

	if s.nc != nil {
		if data, err := json.Marshal(gradeEvent{AssignmentID: assignmentID, StudentID: studentID, Grade: grade, Feedback: feedback}); err == nil {
			if err := s.nc.Publish("grade.submitted", data); err != nil {
				log.Printf("warn: NATS publish grade.submitted failed: %v", err)
			}
		}
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
