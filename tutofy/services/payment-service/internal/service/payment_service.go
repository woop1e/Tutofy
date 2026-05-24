package service

import (
	"context"
	"errors"
	"time"

	"payment-service/internal/model"
	"payment-service/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrForbidden         = errors.New("forbidden")
	ErrNotFound          = errors.New("payment not found")
	ErrInvalidTransition = errors.New("invalid status transition")
)

type PaymentService interface {
	CreatePayment(ctx context.Context, callerID, courseID string, amount float64) (*model.Payment, error)
	CreateLessonPayment(ctx context.Context, callerID, lessonID string, amount float64) (*model.Payment, error)
	GetPayment(ctx context.Context, callerID, callerRole, paymentID string) (*model.Payment, error)
	GetUserPayments(ctx context.Context, callerID, callerRole, userID string, limit, offset int32) ([]*model.Payment, error)
	CompletePayment(ctx context.Context, callerID, callerRole, paymentID string) (*model.Payment, error)
	FailPayment(ctx context.Context, callerRole, paymentID string) (*model.Payment, error)
	CheckCoursePayment(ctx context.Context, userID, courseID string) (bool, error)
	CheckLessonPayment(ctx context.Context, userID, lessonID string) (bool, error)
}

type paymentService struct {
	repo repository.PaymentRepository
}

func NewPaymentService(repo repository.PaymentRepository) PaymentService {
	return &paymentService{repo: repo}
}

func (s *paymentService) CreatePayment(ctx context.Context, callerID, courseID string, amount float64) (*model.Payment, error) {
	p := &model.Payment{
		ID:        uuid.NewString(),
		UserID:    callerID,
		CourseID:  courseID,
		Amount:    amount,
		Status:    model.StatusPending,
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreatePayment(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *paymentService) GetPayment(ctx context.Context, callerID, callerRole, paymentID string) (*model.Payment, error) {
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && p.UserID != callerID {
		return nil, ErrForbidden
	}
	return p, nil
}

func (s *paymentService) GetUserPayments(ctx context.Context, callerID, callerRole, userID string, limit, offset int32) ([]*model.Payment, error) {
	if callerRole != "admin" && callerID != userID {
		return nil, ErrForbidden
	}
	return s.repo.GetByUserID(ctx, userID, limit, offset)
}

func (s *paymentService) CompletePayment(ctx context.Context, callerID, callerRole, paymentID string) (*model.Payment, error) {
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && p.UserID != callerID {
		return nil, ErrForbidden
	}
	if p.Status != model.StatusPending {
		return nil, ErrInvalidTransition
	}
	return s.repo.UpdateStatus(ctx, paymentID, model.StatusCompleted)
}

func (s *paymentService) FailPayment(ctx context.Context, callerRole, paymentID string) (*model.Payment, error) {
	if callerRole != "admin" {
		return nil, ErrForbidden
	}
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if p.Status != model.StatusPending {
		return nil, ErrInvalidTransition
	}
	return s.repo.UpdateStatus(ctx, paymentID, model.StatusFailed)
}

func (s *paymentService) CheckCoursePayment(ctx context.Context, userID, courseID string) (bool, error) {
	return s.repo.HasCompletedPayment(ctx, userID, courseID)
}

func (s *paymentService) CreateLessonPayment(ctx context.Context, callerID, lessonID string, amount float64) (*model.Payment, error) {
	p := &model.Payment{
		ID:        uuid.NewString(),
		UserID:    callerID,
		CourseID:  "",
		LessonID:  lessonID,
		Amount:    amount,
		Status:    model.StatusPending,
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreatePayment(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *paymentService) CheckLessonPayment(ctx context.Context, userID, lessonID string) (bool, error) {
	return s.repo.HasCompletedLessonPayment(ctx, userID, lessonID)
}
