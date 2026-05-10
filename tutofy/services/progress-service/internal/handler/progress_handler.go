package handler

import (
	"context"
	"errors"

	"progress-service/internal/middleware"
	"progress-service/internal/model"
	"progress-service/internal/repository"
	"progress-service/internal/service"
	"progress-service/proto/progresspb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ProgressHandler implements progresspb.ProgressServiceServer.
type ProgressHandler struct {
	progresspb.UnimplementedProgressServiceServer
	svc service.ProgressService
}

// NewProgressHandler creates a new ProgressHandler.
func NewProgressHandler(svc service.ProgressService) *ProgressHandler {
	return &ProgressHandler{svc: svc}
}

// RecordLessonEvent is called by lesson-service whenever a lesson status changes.
func (h *ProgressHandler) RecordLessonEvent(
	ctx context.Context,
	req *progresspb.RecordLessonEventRequest,
) (*progresspb.RecordLessonEventResponse, error) {
	lessonStatus := protoStatusToModel(req.GetStatus())
	if lessonStatus == model.LessonStatusUnspecified {
		return nil, status.Error(codes.InvalidArgument, "lesson status must be specified")
	}

	err := h.svc.RecordLessonEvent(
		ctx,
		req.GetStudentId(),
		req.GetCourseId(),
		req.GetLessonId(),
		lessonStatus,
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &progresspb.RecordLessonEventResponse{}, nil
}

// GetProgress returns progress for a single student in a course.
func (h *ProgressHandler) GetProgress(
	ctx context.Context,
	req *progresspb.GetProgressRequest,
) (*progresspb.ProgressResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	progress, err := h.svc.GetProgress(ctx, callerID, callerRole, req.GetStudentId(), req.GetCourseId())
	if err != nil {
		return nil, mapServiceError(err)
	}
	return toProto(progress), nil
}

// GetCourseProgress returns progress for all students in a course.
func (h *ProgressHandler) GetCourseProgress(
	ctx context.Context,
	req *progresspb.GetCourseProgressRequest,
) (*progresspb.CourseProgressResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	progresses, err := h.svc.GetCourseProgress(ctx, callerID, callerRole, req.GetCourseId(), 50, 0)
	if err != nil {
		return nil, mapServiceError(err)
	}

	list := make([]*progresspb.ProgressResponse, 0, len(progresses))
	for _, p := range progresses {
		list = append(list, toProto(p))
	}
	return &progresspb.CourseProgressResponse{Students: list}, nil
}

// --- helpers ---

func toProto(p *model.Progress) *progresspb.ProgressResponse {
	return &progresspb.ProgressResponse{
		StudentId:        p.StudentID,
		CourseId:         p.CourseID,
		CompletedLessons: int32(p.CompletedLessons),
		CancelledLessons: int32(p.CancelledLessons),
		PlannedLessons:   int32(p.PlannedLessons),
		TotalLessons:     int32(p.Total()),
		CompletionPct:    p.CompletionPct(),
	}
}

func protoStatusToModel(s progresspb.LessonStatus) model.LessonStatus {
	switch s {
	case progresspb.LessonStatus_LESSON_STATUS_PLANNED:
		return model.LessonStatusPlanned
	case progresspb.LessonStatus_LESSON_STATUS_COMPLETED:
		return model.LessonStatusCompleted
	case progresspb.LessonStatus_LESSON_STATUS_CANCELLED:
		return model.LessonStatusCancelled
	default:
		return model.LessonStatusUnspecified
	}
}

func mapServiceError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden):
		return status.Error(codes.PermissionDenied, "forbidden")
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "progress not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
