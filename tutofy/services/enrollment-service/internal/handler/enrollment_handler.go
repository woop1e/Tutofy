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
		if errors.Is(err, repository.ErrAlreadyExists) {
			return nil, status.Error(codes.AlreadyExists, "already enrolled")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(e), nil
}

func (h *EnrollmentHandler) GetUserEnrollments(ctx context.Context, req *enrollmentpb.UserRequest) (*enrollmentpb.EnrollmentsList, error) {
	enrollments, err := h.svc.GetUserEnrollments(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toList(enrollments), nil
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
