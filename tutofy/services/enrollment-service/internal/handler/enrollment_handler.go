package handler

import (
	"context"
	"errors"

	"enrollment-service/internal/middleware"
	"enrollment-service/internal/model"
	"enrollment-service/internal/repository"
	"enrollment-service/internal/service"
	"enrollment-service/proto/enrollmentpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type EnrollmentHandler struct {
	enrollmentpb.UnimplementedEnrollmentServiceServer
	svc service.EnrollmentService
}

func NewEnrollmentHandler(svc service.EnrollmentService) *EnrollmentHandler {
	return &EnrollmentHandler{svc: svc}
}

func (h *EnrollmentHandler) EnrollUser(ctx context.Context, req *enrollmentpb.EnrollRequest) (*enrollmentpb.EnrollmentResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	e, err := h.svc.EnrollUser(ctx, callerID, callerRole, req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrNotStudent) {
			return nil, status.Error(codes.PermissionDenied, err.Error())
		}
		if errors.Is(err, service.ErrPaymentRequired) {
			return nil, status.Error(codes.FailedPrecondition, err.Error())
		}
		if errors.Is(err, repository.ErrAlreadyExists) {
			return nil, status.Error(codes.AlreadyExists, "already enrolled")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(e), nil
}

func (h *EnrollmentHandler) GetUserEnrollments(ctx context.Context, req *enrollmentpb.UserRequest) (*enrollmentpb.EnrollmentsList, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	enrollments, err := h.svc.GetUserEnrollments(ctx, callerID, callerRole, req.GetUserId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toList(enrollments), nil
}

func (h *EnrollmentHandler) UnenrollUser(ctx context.Context, req *enrollmentpb.UnenrollRequest) (*enrollmentpb.Empty, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	err := h.svc.UnenrollUser(ctx, callerID, callerRole, req.GetUserId(), req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "enrollment not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &enrollmentpb.Empty{}, nil
}

func (h *EnrollmentHandler) GetCourseEnrollments(ctx context.Context, req *enrollmentpb.CourseRequest) (*enrollmentpb.EnrollmentsList, error) {
	callerRole := middleware.RoleFromContext(ctx)

	enrollments, err := h.svc.GetCourseEnrollments(ctx, callerRole, req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toList(enrollments), nil
}

func toProto(e *model.Enrollment) *enrollmentpb.EnrollmentResponse {
	return &enrollmentpb.EnrollmentResponse{
		Id:       e.ID,
		UserId:   e.UserID,
		CourseId: e.CourseID,
	}
}

func toList(enrollments []*model.Enrollment) *enrollmentpb.EnrollmentsList {
	list := make([]*enrollmentpb.EnrollmentResponse, 0, len(enrollments))
	for _, e := range enrollments {
		list = append(list, toProto(e))
	}
	return &enrollmentpb.EnrollmentsList{Enrollments: list}
}
