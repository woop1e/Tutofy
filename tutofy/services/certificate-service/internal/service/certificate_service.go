package service

import (
	"context"
	"errors"
	"time"

	"certificate-service/internal/model"
	"certificate-service/internal/repository"

	"course-service/proto/coursepb"
	"progress-service/proto/progresspb"
	"user-service/proto/userpb"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

var (
	ErrForbidden   = errors.New("forbidden")
	ErrNotComplete = errors.New("course not completed yet")
	ErrNotPending  = errors.New("certificate is not in pending status")
)

type CertificateService interface {
	RequestCertificate(ctx context.Context, studentID, courseID string) (*model.Certificate, error)
	ApproveCertificate(ctx context.Context, callerID, callerRole, certID string) (*model.Certificate, error)
	RejectCertificate(ctx context.Context, callerID, callerRole, certID string) (*model.Certificate, error)
	GetPendingCertificates(ctx context.Context, callerID, callerRole string) ([]*model.Certificate, error)
	IssueCertificate(ctx context.Context, callerRole, studentID, courseID string) (*model.Certificate, error)
	GetCertificate(ctx context.Context, callerID, callerRole, courseID string) (*model.Certificate, error)
	GetUserCertificates(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Certificate, error)
}

type certificateService struct {
	repo           repository.CertificateRepository
	progressClient progresspb.ProgressServiceClient
	userClient     userpb.UserServiceClient
	courseClient   coursepb.CourseServiceClient
}

func NewCertificateService(
	repo repository.CertificateRepository,
	progressClient progresspb.ProgressServiceClient,
	userClient userpb.UserServiceClient,
	courseClient coursepb.CourseServiceClient,
) CertificateService {
	return &certificateService{
		repo:           repo,
		progressClient: progressClient,
		userClient:     userClient,
		courseClient:   courseClient,
	}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *certificateService) RequestCertificate(ctx context.Context, studentID, courseID string) (*model.Certificate, error) {
	// Check 100% progress
	progress, err := s.progressClient.GetProgress(outCtx(ctx), &progresspb.GetProgressRequest{
		StudentId: studentID,
		CourseId:  courseID,
	})
	if err != nil || progress.GetCompletionPct() < 100 {
		return nil, ErrNotComplete
	}

	// Fetch course info (title + tutor_id)
	course, err := s.courseClient.GetCourse(context.Background(), &coursepb.GetCourseRequest{CourseId: courseID})
	if err != nil {
		return nil, err
	}

	// Fetch student name
	studentName := ""
	if s.userClient != nil {
		if u, err := s.userClient.GetUser(context.Background(), &userpb.GetUserRequest{UserId: studentID}); err == nil {
			studentName = u.GetName()
		}
	}

	// Fetch tutor name
	tutorName := ""
	tutorID := course.GetTutorId()
	if s.userClient != nil && tutorID != "" {
		if u, err := s.userClient.GetUser(context.Background(), &userpb.GetUserRequest{UserId: tutorID}); err == nil {
			tutorName = u.GetName()
		}
	}

	c := &model.Certificate{
		ID:          uuid.NewString(),
		StudentID:   studentID,
		CourseID:    courseID,
		TutorID:     tutorID,
		Status:      model.CertStatusPending,
		IssuedAt:    time.Now(),
		StudentName: studentName,
		CourseName:  course.GetTitle(),
		TutorName:   tutorName,
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	// If already exists, return existing
	existing, err := s.repo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err == nil {
		return existing, nil
	}
	return c, nil
}

func (s *certificateService) ApproveCertificate(ctx context.Context, callerID, callerRole, certID string) (*model.Certificate, error) {
	cert, err := s.repo.GetByID(ctx, certID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && cert.TutorID != callerID {
		return nil, ErrForbidden
	}
	if cert.Status != model.CertStatusPending {
		return nil, ErrNotPending
	}
	if err := s.repo.UpdateStatus(ctx, certID, model.CertStatusApproved); err != nil {
		return nil, err
	}
	cert.Status = model.CertStatusApproved
	return cert, nil
}

func (s *certificateService) RejectCertificate(ctx context.Context, callerID, callerRole, certID string) (*model.Certificate, error) {
	cert, err := s.repo.GetByID(ctx, certID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && cert.TutorID != callerID {
		return nil, ErrForbidden
	}
	if cert.Status != model.CertStatusPending {
		return nil, ErrNotPending
	}
	if err := s.repo.UpdateStatus(ctx, certID, model.CertStatusRejected); err != nil {
		return nil, err
	}
	cert.Status = model.CertStatusRejected
	return cert, nil
}

func (s *certificateService) GetPendingCertificates(ctx context.Context, callerID, callerRole string) ([]*model.Certificate, error) {
	if callerRole == "admin" {
		return s.repo.GetAllPending(ctx)
	} else if callerRole != "tutor" {
		return nil, ErrForbidden
	}
	return s.repo.GetPendingByTutor(ctx, callerID)
}

func (s *certificateService) IssueCertificate(ctx context.Context, callerRole, studentID, courseID string) (*model.Certificate, error) {
	if callerRole != "admin" && callerRole != "tutor" {
		return nil, ErrForbidden
	}
	if callerRole != "admin" {
		progress, err := s.progressClient.GetProgress(outCtx(ctx), &progresspb.GetProgressRequest{
			StudentId: studentID,
			CourseId:  courseID,
		})
		if err != nil || progress.GetCompletionPct() < 100 {
			return nil, ErrNotComplete
		}
	}
	c := &model.Certificate{
		ID:       uuid.NewString(),
		StudentID: studentID,
		CourseID:  courseID,
		Status:    model.CertStatusApproved,
		IssuedAt:  time.Now(),
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	existing, err := s.repo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err == nil {
		return existing, nil
	}
	return c, nil
}

func (s *certificateService) GetCertificate(ctx context.Context, callerID, callerRole, courseID string) (*model.Certificate, error) {
	return s.repo.GetByStudentAndCourse(ctx, callerID, courseID)
}

func (s *certificateService) GetUserCertificates(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Certificate, error) {
	if callerRole == "" {
		return nil, ErrForbidden
	}
	if callerRole == "student" && callerID != studentID {
		return nil, ErrForbidden
	}
	return s.repo.GetByStudent(ctx, studentID)
}
