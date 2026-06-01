package service

import (
	"context"
	"errors"
	"fmt"
	"log"

	"assignment-service/proto/assignmentpb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/internal/model"
	"grading-service/internal/repository"
	"notification-service/proto/notificationpb"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

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
	repo               repository.GradeRepository
	assignmentClient   assignmentpb.AssignmentServiceClient
	enrollmentClient   enrollmentpb.EnrollmentServiceClient
	notificationClient notificationpb.NotificationServiceClient
}

func NewGradingService(
	repo repository.GradeRepository,
	assignmentClient assignmentpb.AssignmentServiceClient,
	enrollmentClient enrollmentpb.EnrollmentServiceClient,
	notificationClient notificationpb.NotificationServiceClient,
) GradingService {
	return &gradingService{
		repo:               repo,
		assignmentClient:   assignmentClient,
		enrollmentClient:   enrollmentClient,
		notificationClient: notificationClient,
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

	if s.notificationClient != nil {
		md, _ := metadata.FromIncomingContext(ctx)
		notifCtx := metadata.NewOutgoingContext(context.Background(), md)
		go func() {
			title := "your assignment"
			if s.assignmentClient != nil {
				if ar, err2 := s.assignmentClient.GetAssignment(notifCtx, &assignmentpb.GetAssignmentRequest{AssignmentId: assignmentID}); err2 == nil && ar.GetTitle() != "" {
					title = "\"" + ar.GetTitle() + "\""
				}
			}
			_, err := s.notificationClient.NotifyUser(notifCtx, &notificationpb.NotifyUserRequest{
				UserId:  studentID,
				Type:    1, // NOTIFICATION_TYPE_GRADE
				Message: fmt.Sprintf("Your assignment %s has been graded: %.2f", title, grade),
			})
			if err != nil {
				log.Printf("warn: grade notification failed for student %s: %v", studentID, err)
			}
		}()
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
