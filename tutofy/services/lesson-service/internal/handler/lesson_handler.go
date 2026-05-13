package handler

import (
	"context"
	"errors"

	"lesson-service/internal/middleware"
	"lesson-service/internal/model"
	"lesson-service/internal/repository"
	"lesson-service/internal/service"
	"lesson-service/proto/lessonpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// LessonHandler implements lessonpb.LessonServiceServer.
type LessonHandler struct {
	lessonpb.UnimplementedLessonServiceServer
	svc service.LessonService
}

// NewLessonHandler creates a new LessonHandler.
func NewLessonHandler(svc service.LessonService) *LessonHandler {
	return &LessonHandler{svc: svc}
}

func (h *LessonHandler) CreateLesson(ctx context.Context, req *lessonpb.CreateLessonRequest) (*lessonpb.Lesson, error) {
	switch {
	case req.GetTitle() == "":
		return nil, status.Error(codes.InvalidArgument, "title is required")
	case req.GetDurationMinutes() <= 0:
		return nil, status.Error(codes.InvalidArgument, "duration_minutes must be greater than 0")
	case req.GetScheduledAt() == nil || req.GetScheduledAt().AsTime().IsZero():
		return nil, status.Error(codes.InvalidArgument, "scheduled_at is required")
	case req.GetCourseId() == "":
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	lesson, err := h.svc.CreateLesson(
		ctx,
		callerID, callerRole,
		req.GetCourseId(),
		req.GetTitle(),
		req.GetVideoLink(),
		req.GetScheduledAt().AsTime(),
		req.GetDurationMinutes(),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) GetLesson(ctx context.Context, req *lessonpb.GetLessonRequest) (*lessonpb.Lesson, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	lesson, err := h.svc.GetLesson(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) GetCourseLessons(ctx context.Context, req *lessonpb.GetCourseLessonsRequest) (*lessonpb.CourseLessonsList, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	lessons, err := h.svc.GetCourseLessons(ctx, callerID, callerRole, req.GetCourseId(), 50, 0)
	if err != nil {
		return nil, mapError(err)
	}

	list := make([]*lessonpb.Lesson, 0, len(lessons))
	for _, l := range lessons {
		list = append(list, toProto(l))
	}
	return &lessonpb.CourseLessonsList{Lessons: list}, nil
}

func (h *LessonHandler) UpdateLessonStatus(ctx context.Context, req *lessonpb.UpdateLessonStatusRequest) (*lessonpb.Lesson, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	lessonStatus := protoStatusToModel(req.GetStatus())
	if lessonStatus == model.LessonStatusUnspecified {
		return nil, status.Error(codes.InvalidArgument, "lesson status must be specified")
	}

	lesson, err := h.svc.UpdateLessonStatus(ctx, callerID, callerRole, req.GetLessonId(), lessonStatus)
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) DeleteLesson(ctx context.Context, req *lessonpb.DeleteLessonRequest) (*lessonpb.Empty, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	if err := h.svc.DeleteLesson(ctx, callerID, callerRole, req.GetLessonId()); err != nil {
		return nil, mapError(err)
	}
	return &lessonpb.Empty{}, nil
}

// --- helpers ---

func toProto(l *model.Lesson) *lessonpb.Lesson {
	return &lessonpb.Lesson{
		Id:              l.ID,
		CourseId:        l.CourseID,
		TutorId:         l.TutorID,
		Title:           l.Title,
		ScheduledAt:     timestamppb.New(l.ScheduledAt),
		DurationMinutes: l.DurationMinutes,
		VideoLink:       l.VideoLink,
		Status:          modelStatusToProto(l.Status),
	}
}

func protoStatusToModel(s lessonpb.LessonStatus) model.LessonStatus {
	switch s {
	case lessonpb.LessonStatus_LESSON_STATUS_PLANNED:
		return model.LessonStatusPlanned
	case lessonpb.LessonStatus_LESSON_STATUS_COMPLETED:
		return model.LessonStatusCompleted
	case lessonpb.LessonStatus_LESSON_STATUS_CANCELLED:
		return model.LessonStatusCancelled
	default:
		return model.LessonStatusUnspecified
	}
}

func modelStatusToProto(s model.LessonStatus) lessonpb.LessonStatus {
	switch s {
	case model.LessonStatusPlanned:
		return lessonpb.LessonStatus_LESSON_STATUS_PLANNED
	case model.LessonStatusCompleted:
		return lessonpb.LessonStatus_LESSON_STATUS_COMPLETED
	case model.LessonStatusCancelled:
		return lessonpb.LessonStatus_LESSON_STATUS_CANCELLED
	default:
		return lessonpb.LessonStatus_LESSON_STATUS_UNSPECIFIED
	}
}

func mapError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotTutorOrAdmin):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotEnrolled):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "lesson not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}

func (h *LessonHandler) MarkAttendance(ctx context.Context, req *lessonpb.MarkAttendanceRequest) (*lessonpb.Empty, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	if len(req.GetStudentIds()) == 0 {
		return nil, status.Error(codes.InvalidArgument, "student_ids must not be empty")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	if err := h.svc.MarkAttendance(ctx, callerID, callerRole, req.GetLessonId(), req.GetStudentIds(), req.GetAttended()); err != nil {
		return nil, mapError(err)
	}
	return &lessonpb.Empty{}, nil
}

func (h *LessonHandler) GetMySchedule(ctx context.Context, req *lessonpb.GetScheduleRequest) (*lessonpb.CourseLessonsList, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	lessons, err := h.svc.GetMySchedule(ctx, callerID, callerRole, req.GetFromDate(), req.GetToDate())
	if err != nil {
		return nil, mapError(err)
	}
	list := make([]*lessonpb.Lesson, 0, len(lessons))
	for _, l := range lessons {
		list = append(list, toProto(l))
	}
	return &lessonpb.CourseLessonsList{Lessons: list}, nil
}

func (h *LessonHandler) AddMaterial(ctx context.Context, req *lessonpb.AddMaterialRequest) (*lessonpb.MaterialResponse, error) {
	if req.GetLessonId() == "" || req.GetFileId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id and file_id are required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	if err := h.svc.AddMaterial(ctx, callerID, callerRole, req.GetLessonId(), req.GetFileId(), req.GetTitle()); err != nil {
		return nil, mapError(err)
	}
	return &lessonpb.MaterialResponse{LessonId: req.GetLessonId(), FileId: req.GetFileId(), Title: req.GetTitle()}, nil
}

func (h *LessonHandler) GetLessonMaterials(ctx context.Context, req *lessonpb.GetLessonMaterialsRequest) (*lessonpb.MaterialsList, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	mats, err := h.svc.GetLessonMaterials(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	list := make([]*lessonpb.MaterialResponse, 0, len(mats))
	for _, m := range mats {
		list = append(list, &lessonpb.MaterialResponse{Id: m.ID, LessonId: m.LessonID, FileId: m.FileID, Title: m.Title, UploadedAt: m.UploadedAt})
	}
	return &lessonpb.MaterialsList{Materials: list}, nil
}

func (h *LessonHandler) GetAttendance(ctx context.Context, req *lessonpb.GetAttendanceRequest) (*lessonpb.AttendanceList, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	rows, err := h.svc.GetAttendance(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	records := make([]*lessonpb.AttendanceRecord, 0, len(rows))
	for _, r := range rows {
		records = append(records, &lessonpb.AttendanceRecord{
			LessonId:  r.LessonID,
			StudentId: r.StudentID,
			Attended:  r.Attended,
		})
	}
	return &lessonpb.AttendanceList{Records: records}, nil
}
