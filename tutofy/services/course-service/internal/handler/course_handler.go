package handler

import (
	"context"
	"errors"

	"course-service/internal/middleware"
	"course-service/internal/model"
	"course-service/internal/repository"
	"course-service/internal/service"
	"course-service/proto/coursepb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CourseHandler struct {
	coursepb.UnimplementedCourseServiceServer
	svc service.CourseService
}

func NewCourseHandler(svc service.CourseService) *CourseHandler {
	return &CourseHandler{svc: svc}
}

func (h *CourseHandler) CreateCourse(ctx context.Context, req *coursepb.CreateCourseRequest) (*coursepb.CourseResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	course, err := h.svc.CreateCourse(ctx, callerID, callerRole, req.GetTitle(), req.GetDescription())
	if err != nil {
		if errors.Is(err, service.ErrNotTutor) {
			return nil, status.Error(codes.PermissionDenied, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(course), nil
}

func (h *CourseHandler) GetCourse(ctx context.Context, req *coursepb.GetCourseRequest) (*coursepb.CourseResponse, error) {
	course, err := h.svc.GetCourse(ctx, req.GetCourseId())
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "course not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(course), nil
}

func (h *CourseHandler) GetAllCourses(ctx context.Context, _ *coursepb.Empty) (*coursepb.CoursesList, error) {
	courses, err := h.svc.GetAllCourses(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*coursepb.CourseResponse, 0, len(courses))
	for _, c := range courses {
		list = append(list, toProto(c))
	}
	return &coursepb.CoursesList{Courses: list}, nil
}

func (h *CourseHandler) DeleteCourse(ctx context.Context, req *coursepb.DeleteCourseRequest) (*coursepb.Empty, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	err := h.svc.DeleteCourse(ctx, callerID, callerRole, req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "course not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &coursepb.Empty{}, nil
}

func toProto(c *model.Course) *coursepb.CourseResponse {
	return &coursepb.CourseResponse{
		Id:          c.ID,
		Title:       c.Title,
		Description: c.Description,
		TutorId:     c.TutorID,
	}
}
