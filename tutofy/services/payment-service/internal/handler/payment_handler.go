package handler

import (
	"context"
	"errors"

	"payment-service/internal/middleware"
	"payment-service/internal/model"
	"payment-service/internal/repository"
	"payment-service/internal/service"
	"payment-service/proto/paymentpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type PaymentHandler struct {
	paymentpb.UnimplementedPaymentServiceServer
	svc service.PaymentService
}

func NewPaymentHandler(svc service.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

func (h *PaymentHandler) CreatePayment(ctx context.Context, req *paymentpb.CreatePaymentRequest) (*paymentpb.PaymentResponse, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	if req.GetAmount() <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be greater than 0")
	}

	callerID := middleware.UserIDFromContext(ctx)

	p, err := h.svc.CreatePayment(ctx, callerID, req.GetCourseId(), req.GetAmount())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(p), nil
}

func (h *PaymentHandler) CreateLessonPayment(ctx context.Context, req *paymentpb.CreateLessonPaymentRequest) (*paymentpb.PaymentResponse, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	if req.GetAmount() <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be greater than 0")
	}
	callerID := middleware.UserIDFromContext(ctx)
	p, err := h.svc.CreateLessonPayment(ctx, callerID, req.GetLessonId(), req.GetAmount())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(p), nil
}

func (h *PaymentHandler) CheckLessonPayment(ctx context.Context, req *paymentpb.CheckLessonPaymentRequest) (*paymentpb.CheckLessonPaymentResponse, error) {
	if req.GetUserId() == "" || req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id and lesson_id are required")
	}
	hasPaid, err := h.svc.CheckLessonPayment(ctx, req.GetUserId(), req.GetLessonId())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &paymentpb.CheckLessonPaymentResponse{HasPaid: hasPaid}, nil
}

func (h *PaymentHandler) GetPayment(ctx context.Context, req *paymentpb.GetPaymentRequest) (*paymentpb.PaymentResponse, error) {
	if req.GetPaymentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "payment_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	p, err := h.svc.GetPayment(ctx, callerID, callerRole, req.GetPaymentId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(p), nil
}

func (h *PaymentHandler) GetUserPayments(ctx context.Context, req *paymentpb.GetUserPaymentsRequest) (*paymentpb.PaymentsList, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())

	payments, err := h.svc.GetUserPayments(ctx, callerID, callerRole, req.GetUserId(), limit, offset)
	if err != nil {
		return nil, mapError(err)
	}

	list := make([]*paymentpb.PaymentResponse, 0, len(payments))
	for _, p := range payments {
		list = append(list, toProto(p))
	}
	return &paymentpb.PaymentsList{Payments: list}, nil
}

func (h *PaymentHandler) CompletePayment(ctx context.Context, req *paymentpb.UpdatePaymentStatusRequest) (*paymentpb.PaymentResponse, error) {
	if req.GetPaymentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "payment_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	p, err := h.svc.CompletePayment(ctx, callerID, callerRole, req.GetPaymentId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(p), nil
}

func (h *PaymentHandler) FailPayment(ctx context.Context, req *paymentpb.UpdatePaymentStatusRequest) (*paymentpb.PaymentResponse, error) {
	if req.GetPaymentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "payment_id is required")
	}

	callerRole := middleware.RoleFromContext(ctx)

	p, err := h.svc.FailPayment(ctx, callerRole, req.GetPaymentId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(p), nil
}

func toProto(p *model.Payment) *paymentpb.PaymentResponse {
	return &paymentpb.PaymentResponse{
		PaymentId: p.ID,
		UserId:    p.UserID,
		CourseId:  p.CourseID,
		LessonId:  p.LessonID,
		Amount:    p.Amount,
		Status:    string(p.Status),
		CreatedAt: p.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func mapError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden):
		return status.Error(codes.PermissionDenied, "forbidden")
	case errors.Is(err, service.ErrNotFound), errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "payment not found")
	case errors.Is(err, service.ErrInvalidTransition):
		return status.Error(codes.FailedPrecondition, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}

func pageParams(limit, offset int32) (int32, int32) {
	if limit <= 0 {
		limit = 50
	}
	return limit, offset
}

func (h *PaymentHandler) CheckCoursePayment(ctx context.Context, req *paymentpb.CheckCoursePaymentRequest) (*paymentpb.CheckCoursePaymentResponse, error) {
	if req.GetUserId() == "" || req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id and course_id are required")
	}
	hasPaid, err := h.svc.CheckCoursePayment(ctx, req.GetUserId(), req.GetCourseId())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &paymentpb.CheckCoursePaymentResponse{HasPaid: hasPaid}, nil
}
