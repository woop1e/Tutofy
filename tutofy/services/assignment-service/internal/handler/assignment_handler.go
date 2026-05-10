package handler

import (
	"context"
	"errors"

	"assignment-service/internal/middleware"
	"assignment-service/internal/model"
	"assignment-service/internal/repository"
	"assignment-service/internal/service"
	"assignment-service/proto/assignmentpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AssignmentHandler struct {
	assignmentpb.UnimplementedAssignmentServiceServer
	svc service.AssignmentService
}

func NewAssignmentHandler(svc service.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{svc: svc}
}

func (h *AssignmentHandler) CreateAssignment(ctx context.Context, req *assignmentpb.CreateAssignmentRequest) (*assignmentpb.AssignmentResponse, error) {
	if req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	a, err := h.svc.CreateAssignment(ctx, callerID, callerRole, req.GetTitle(), req.GetDescription(), req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrNotTutor) {
			return nil, status.Error(codes.PermissionDenied, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(a), nil
}

func (h *AssignmentHandler) GetAssignment(ctx context.Context, req *assignmentpb.GetAssignmentRequest) (*assignmentpb.AssignmentResponse, error) {
	a, err := h.svc.GetAssignment(ctx, req.GetAssignmentId())
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(a), nil
}

func (h *AssignmentHandler) GetAssignmentsByCourse(ctx context.Context, req *assignmentpb.CourseRequest) (*assignmentpb.AssignmentsList, error) {
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())
	assignments, err := h.svc.GetAssignmentsByCourse(ctx, req.GetCourseId(), limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*assignmentpb.AssignmentResponse, 0, len(assignments))
	for _, a := range assignments {
		list = append(list, toProto(a))
	}
	return &assignmentpb.AssignmentsList{Assignments: list}, nil
}

func (h *AssignmentHandler) UpdateAssignment(ctx context.Context, req *assignmentpb.UpdateAssignmentRequest) (*assignmentpb.AssignmentResponse, error) {
	if req.GetTitle() == "" && req.GetDescription() == "" && req.GetDueDate() == "" {
		return nil, status.Error(codes.InvalidArgument, "at least one of title, description, or due_date must be provided")
	}
	if req.GetAssignmentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "assignment_id is required")
	}

	callerRole := middleware.RoleFromContext(ctx)

	a, err := h.svc.UpdateAssignment(ctx, callerRole, req.GetAssignmentId(), req.GetTitle(), req.GetDescription(), req.GetDueDate())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(a), nil
}

func (h *AssignmentHandler) DeleteAssignment(ctx context.Context, req *assignmentpb.DeleteAssignmentRequest) (*assignmentpb.Empty, error) {
	callerRole := middleware.RoleFromContext(ctx)

	err := h.svc.DeleteAssignment(ctx, callerRole, req.GetAssignmentId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &assignmentpb.Empty{}, nil
}

func pageParams(limit, offset int32) (int32, int32) {
	if limit <= 0 {
		limit = 50
	}
	return limit, offset
}

func toProto(a *model.Assignment) *assignmentpb.AssignmentResponse {
	return &assignmentpb.AssignmentResponse{
		Id:          a.ID,
		Title:       a.Title,
		Description: a.Description,
		CourseId:    a.CourseID,
		DueDate:     a.DueDate,
	}
}
