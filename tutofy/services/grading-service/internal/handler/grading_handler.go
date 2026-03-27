package handler

import (
	"context"
	"errors"

	"grading-service/internal/middleware"
	"grading-service/internal/model"
	"grading-service/internal/service"
	"grading-service/proto/gradingpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GradingHandler struct {
	gradingpb.UnimplementedGradingServiceServer
	svc service.GradingService
}

func NewGradingHandler(svc service.GradingService) *GradingHandler {
	return &GradingHandler{svc: svc}
}

func (h *GradingHandler) SubmitGrade(ctx context.Context, req *gradingpb.SubmitGradeRequest) (*gradingpb.GradeResponse, error) {
	callerRole := middleware.RoleFromContext(ctx)

	g, err := h.svc.SubmitGrade(ctx, callerRole, req.GetAssignmentId(), req.GetStudentId(), req.GetGrade())
	if err != nil {
		if errors.Is(err, service.ErrNotTutor) {
			return nil, status.Error(codes.PermissionDenied, err.Error())
		}
		if errors.Is(err, service.ErrNotEnrolled) {
			return nil, status.Error(codes.FailedPrecondition, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(g), nil
}

func (h *GradingHandler) GetStudentGrades(ctx context.Context, req *gradingpb.StudentRequest) (*gradingpb.GradesList, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	grades, err := h.svc.GetStudentGrades(ctx, callerID, callerRole, req.GetStudentId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toList(grades), nil
}

func (h *GradingHandler) GetAssignmentGrades(ctx context.Context, req *gradingpb.AssignmentRequest) (*gradingpb.GradesList, error) {
	callerRole := middleware.RoleFromContext(ctx)

	grades, err := h.svc.GetAssignmentGrades(ctx, callerRole, req.GetAssignmentId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toList(grades), nil
}

func toProto(g *model.Grade) *gradingpb.GradeResponse {
	return &gradingpb.GradeResponse{
		Id:           g.ID,
		AssignmentId: g.AssignmentID,
		StudentId:    g.StudentID,
		Grade:        g.Grade,
	}
}

func toList(grades []*model.Grade) *gradingpb.GradesList {
	list := make([]*gradingpb.GradeResponse, 0, len(grades))
	for _, g := range grades {
		list = append(list, toProto(g))
	}
	return &gradingpb.GradesList{Grades: list}
}
