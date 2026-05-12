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
	if req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if len(req.GetTitle()) > 200 {
		return nil, status.Error(codes.InvalidArgument, "title must be 200 characters or fewer")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	course, err := h.svc.CreateCourse(ctx, callerID, callerRole, req.GetTitle(), req.GetDescription(), req.GetPrice(),
		req.GetCourseType(), req.GetMaxStudents(), req.GetEnrollmentDeadline())
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

func (h *CourseHandler) GetAllCourses(ctx context.Context, req *coursepb.GetAllCoursesRequest) (*coursepb.CoursesList, error) {
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())
	courses, err := h.svc.GetAllCourses(ctx, limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*coursepb.CourseResponse, 0, len(courses))
	for _, c := range courses {
		list = append(list, toProto(c))
	}
	return &coursepb.CoursesList{Courses: list}, nil
}

func pageParams(limit, offset int32) (int32, int32) {
	if limit <= 0 {
		limit = 50
	}
	return limit, offset
}

func (h *CourseHandler) UpdateCourse(ctx context.Context, req *coursepb.UpdateCourseRequest) (*coursepb.CourseResponse, error) {
	if req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if len(req.GetTitle()) > 200 {
		return nil, status.Error(codes.InvalidArgument, "title must be 200 characters or fewer")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	course, err := h.svc.UpdateCourse(ctx, callerID, callerRole, req.GetCourseId(), req.GetTitle(), req.GetDescription(),
		req.GetCourseType(), req.GetMaxStudents(), req.GetEnrollmentDeadline())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "course not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(course), nil
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

func (h *CourseHandler) PublishCourse(ctx context.Context, req *coursepb.PublishCourseRequest) (*coursepb.CourseResponse, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	course, err := h.svc.PublishCourse(ctx, callerID, callerRole, req.GetCourseId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "course not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(course), nil
}

func toProto(c *model.Course) *coursepb.CourseResponse {
	return &coursepb.CourseResponse{
		Id:                 c.ID,
		Title:              c.Title,
		Description:        c.Description,
		TutorId:            c.TutorID,
		Price:              c.Price,
		CourseType:         c.CourseType,
		MaxStudents:        c.MaxStudents,
		EnrollmentDeadline: c.EnrollmentDeadline,
		IsPublished:        c.IsPublished,
	}
}

func (h *CourseHandler) AddTag(ctx context.Context, req *coursepb.TagRequest) (*coursepb.Empty, error) {
	if req.GetCourseId() == "" || req.GetTagName() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id and tag_name are required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	if err := h.svc.AddTag(ctx, callerID, callerRole, req.GetCourseId(), req.GetTagName()); err != nil {
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

func (h *CourseHandler) RemoveTag(ctx context.Context, req *coursepb.TagRequest) (*coursepb.Empty, error) {
	if req.GetCourseId() == "" || req.GetTagName() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id and tag_name are required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	if err := h.svc.RemoveTag(ctx, callerID, callerRole, req.GetCourseId(), req.GetTagName()); err != nil {
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

func (h *CourseHandler) GetCoursesByTag(ctx context.Context, req *coursepb.GetCoursesByTagRequest) (*coursepb.CoursesList, error) {
	if req.GetTagName() == "" {
		return nil, status.Error(codes.InvalidArgument, "tag_name is required")
	}
	courses, err := h.svc.GetCoursesByTag(ctx, req.GetTagName(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	list := make([]*coursepb.CourseResponse, 0, len(courses))
	for _, c := range courses {
		list = append(list, toProto(c))
	}
	return &coursepb.CoursesList{Courses: list}, nil
}

func (h *CourseHandler) SearchCourses(ctx context.Context, req *coursepb.SearchCoursesRequest) (*coursepb.CoursesList, error) {
	limit := req.GetLimit()
	if limit <= 0 {
		limit = 50
	}
	courses, err := h.svc.SearchCourses(ctx,
		req.GetTutorId(), req.GetTag(), req.GetCourseType(),
		req.GetMinPrice(), req.GetMaxPrice(), limit, req.GetOffset(),
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	list := make([]*coursepb.CourseResponse, 0, len(courses))
	for _, c := range courses {
		list = append(list, toProto(c))
	}
	return &coursepb.CoursesList{Courses: list}, nil
}
