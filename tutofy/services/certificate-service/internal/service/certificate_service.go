package service

import (
	"context"
	"errors"
	"time"

	"certificate-service/internal/model"
	"certificate-service/internal/repository"
	"progress-service/proto/progresspb"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

var (
	ErrForbidden      = errors.New("forbidden")
	ErrNotComplete    = errors.New("course not completed yet")
)

type CertificateService interface {
	// IssueCertificate is called internally (e.g. by progress-service trigger or admin).
	IssueCertificate(ctx context.Context, callerRole, studentID, courseID string) (*model.Certificate, error)
	GetCertificate(ctx context.Context, callerID, callerRole, courseID string) (*model.Certificate, error)
	GetUserCertificates(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Certificate, error)
}

type certificateService struct {
	repo           repository.CertificateRepository
	progressClient progresspb.ProgressServiceClient
}

func NewCertificateService(repo repository.CertificateRepository, progressClient progresspb.ProgressServiceClient) CertificateService {
	return &certificateService{repo: repo, progressClient: progressClient}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *certificateService) IssueCertificate(ctx context.Context, callerRole, studentID, courseID string) (*model.Certificate, error) {
	if callerRole != "admin" {
		// Verify 100% progress before issuing.
		progress, err := s.progressClient.GetProgress(outCtx(ctx), &progresspb.GetProgressRequest{
			StudentId: studentID,
			CourseId:  courseID,
		})
		if err != nil || progress.GetCompletionPct() < 100 {
			return nil, ErrNotComplete
		}
	}

	c := &model.Certificate{
		ID:        uuid.NewString(),
		StudentID: studentID,
		CourseID:  courseID,
		IssuedAt:  time.Now(),
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	// If already exists, fetch and return it.
	existing, err := s.repo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err == nil {
		return existing, nil
	}
	return c, nil
}

func (s *certificateService) GetCertificate(ctx context.Context, callerID, callerRole, courseID string) (*model.Certificate, error) {
	studentID := callerID
	if callerRole == "admin" {
		studentID = callerID // admins query their own unless specified
	}
	return s.repo.GetByStudentAndCourse(ctx, studentID, courseID)
}

func (s *certificateService) GetUserCertificates(ctx context.Context, callerID, callerRole, studentID string) ([]*model.Certificate, error) {
	if callerRole == "student" && callerID != studentID {
		return nil, ErrForbidden
	}
	return s.repo.GetByStudent(ctx, studentID)
}
