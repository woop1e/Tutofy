package handler

import (
	"context"
	"errors"
	"time"

	"lesson-service/internal/middleware"
	"lesson-service/internal/model"
	"lesson-service/internal/repository"
	"lesson-service/internal/service"
	"lesson-service/proto/lessonpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
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
	if req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}

	// Individual 1-on-1 booking: course_id is empty, tutor_id passed via metadata.
	if req.GetCourseId() == "" {
		md, _ := metadata.FromIncomingContext(ctx)
		tutorIDs := md.Get("x-tutor-id")
		if len(tutorIDs) == 0 || tutorIDs[0] == "" {
			return nil, status.Error(codes.InvalidArgument, "course_id is required (or x-tutor-id for individual booking)")
		}
		studentID := middleware.UserIDFromContext(ctx)
		lesson, err := h.svc.BookIndividualLesson(ctx, tutorIDs[0], studentID, req.GetTitle(), "", req.GetScheduledAt().AsTime(), req.GetDurationMinutes(), 0)
		if err != nil {
			return nil, mapError(err)
		}
		return toProto(lesson), nil
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	description := req.GetDescription()
	lesson, err := h.svc.CreateLesson(
		ctx,
		callerID, callerRole,
		req.GetCourseId(),
		req.GetTitle(),
		req.GetVideoLink(),
		description,
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
	lesson := &lessonpb.Lesson{
		Id:              l.ID,
		CourseId:        l.CourseID,
		TutorId:         l.TutorID,
		StudentId:       l.StudentID,
		Title:           l.Title,
		ScheduledAt:     timestamppb.New(l.ScheduledAt),
		DurationMinutes: l.DurationMinutes,
		VideoLink:       l.VideoLink,
		Status:          modelStatusToProto(l.Status),
		Price:           l.Price,
		Description:     l.Description,
		StudentRating:   l.StudentRating,
	}
	if !l.PaymentDeadline.IsZero() {
		lesson.PaymentDeadline = timestamppb.New(l.PaymentDeadline)
	}
	return lesson
}

func protoStatusToModel(s lessonpb.LessonStatus) model.LessonStatus {
	switch s {
	case lessonpb.LessonStatus_LESSON_STATUS_PLANNED:
		return model.LessonStatusPlanned
	case lessonpb.LessonStatus_LESSON_STATUS_COMPLETED:
		return model.LessonStatusCompleted
	case lessonpb.LessonStatus_LESSON_STATUS_CANCELLED:
		return model.LessonStatusCancelled
	case lessonpb.LessonStatus_LESSON_STATUS_PENDING_CONFIRMATION:
		return model.LessonStatusPendingConfirmation
	case lessonpb.LessonStatus_LESSON_STATUS_AWAITING_PAYMENT:
		return model.LessonStatusAwaitingPayment
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
	case model.LessonStatusPendingConfirmation:
		return lessonpb.LessonStatus_LESSON_STATUS_PENDING_CONFIRMATION
	case model.LessonStatusAwaitingPayment:
		return lessonpb.LessonStatus_LESSON_STATUS_AWAITING_PAYMENT
	case model.LessonStatusPaymentExpired:
		return lessonpb.LessonStatus(6) // PaymentExpired — not in proto enum, passed as raw int
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
	case errors.Is(err, service.ErrWrongStatus), errors.Is(err, service.ErrPaymentExpired):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "lesson not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}

func (h *LessonHandler) GetLessonDescriptions(ctx context.Context, req *lessonpb.GetLessonDescriptionsRequest) (*lessonpb.LessonDescriptionsList, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	descs, err := h.svc.GetCourseDescriptions(ctx, req.GetCourseId())
	if err != nil {
		return nil, mapError(err)
	}
	items := make([]*lessonpb.LessonDescription, 0, len(descs))
	for id, desc := range descs {
		items = append(items, &lessonpb.LessonDescription{Id: id, Description: desc})
	}
	return &lessonpb.LessonDescriptionsList{Items: items}, nil
}

func (h *LessonHandler) GetCourseAttendanceSummary(ctx context.Context, req *lessonpb.GetCourseAttendanceSummaryRequest) (*lessonpb.CourseAttendanceSummary, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	summary, err := h.svc.GetCourseAttendanceSummary(ctx, req.GetCourseId())
	if err != nil {
		return nil, mapError(err)
	}
	result := make([]*lessonpb.StudentAttendanceSummary, 0, len(summary))
	for studentID, counts := range summary {
		result = append(result, &lessonpb.StudentAttendanceSummary{
			StudentId: studentID,
			Attended:  counts[0],
			Total:     counts[1],
		})
	}
	return &lessonpb.CourseAttendanceSummary{Summaries: result}, nil
}

func (h *LessonHandler) BookIndividualLesson(ctx context.Context, req *lessonpb.BookIndividualLessonRequest) (*lessonpb.Lesson, error) {
	if req.GetTutorId() == "" {
		return nil, status.Error(codes.InvalidArgument, "tutor_id is required")
	}
	if req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if req.GetScheduledAt() == nil {
		return nil, status.Error(codes.InvalidArgument, "scheduled_at is required")
	}
	// Prefer x-student-id from metadata (set by api-gateway directly from JWT).
	// Fall back to UserIDFromContext which relies on authpb ValidateToken.
	studentID := middleware.UserIDFromContext(ctx)
	if studentID == "" {
		if md, ok := metadata.FromIncomingContext(ctx); ok {
			if vals := md.Get("x-student-id"); len(vals) > 0 {
				studentID = vals[0]
			}
		}
	}
	if studentID == "" {
		return nil, status.Error(codes.InvalidArgument, "could not determine student identity")
	}
	// Use student name as description so tutor dashboard can display it
	studentName := ""
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if vals := md.Get("x-student-name"); len(vals) > 0 {
			studentName = vals[0]
		}
	}
	lesson, err := h.svc.BookIndividualLesson(ctx,
		req.GetTutorId(), studentID, req.GetTitle(), studentName,
		req.GetScheduledAt().AsTime(), req.GetDurationMinutes(), req.GetPrice(),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) ConfirmLesson(ctx context.Context, req *lessonpb.ConfirmLessonRequest) (*lessonpb.Lesson, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	lesson, err := h.svc.ConfirmLesson(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) DeclineLesson(ctx context.Context, req *lessonpb.DeclineLessonRequest) (*lessonpb.Lesson, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	lesson, err := h.svc.DeclineLesson(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) ActivateLesson(ctx context.Context, req *lessonpb.ActivateLessonRequest) (*lessonpb.Lesson, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	lesson, err := h.svc.ActivateLesson(ctx, callerID, callerRole, req.GetLessonId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) SetVideoLink(ctx context.Context, req *lessonpb.SetVideoLinkRequest) (*lessonpb.Lesson, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	lesson, err := h.svc.SetVideoLink(ctx, callerID, callerRole, req.GetLessonId(), req.GetVideoLink())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(lesson), nil
}

func (h *LessonHandler) MarkAttendance(ctx context.Context, req *lessonpb.MarkAttendanceRequest) (*lessonpb.Empty, error) {
	if req.GetLessonId() == "" {
		return nil, status.Error(codes.InvalidArgument, "lesson_id is required")
	}
	if len(req.GetRecords()) == 0 {
		return nil, status.Error(codes.InvalidArgument, "records must not be empty")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)
	entries := make([]service.AttendanceEntry, len(req.GetRecords()))
	for i, r := range req.GetRecords() {
		entries[i] = service.AttendanceEntry{StudentID: r.GetStudentId(), Status: r.GetStatus()}
	}
	if err := h.svc.MarkAttendance(ctx, callerID, callerRole, req.GetLessonId(), entries); err != nil {
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

func (h *LessonHandler) GetStudentLessons(ctx context.Context, req *lessonpb.GetStudentLessonsRequest) (*lessonpb.CourseLessonsList, error) {
	studentID := req.GetStudentId()
	if studentID == "" {
		studentID = middleware.UserIDFromContext(ctx)
	}
	lessons, err := h.svc.GetStudentLessons(ctx, studentID)
	if err != nil {
		return nil, mapError(err)
	}
	list := make([]*lessonpb.Lesson, 0, len(lessons))
	for _, l := range lessons {
		list = append(list, toProto(l))
	}
	return &lessonpb.CourseLessonsList{Lessons: list}, nil
}

func (h *LessonHandler) GetTutorIndividualLessons(ctx context.Context, _ *lessonpb.Empty) (*lessonpb.CourseLessonsList, error) {
	tutorID := middleware.UserIDFromContext(ctx)
	if tutorID == "" {
		return nil, status.Error(codes.Unauthenticated, "authentication required")
	}
	lessons, err := h.svc.GetTutorIndividualLessons(ctx, tutorID)
	if err != nil {
		return nil, mapError(err)
	}
	list := make([]*lessonpb.Lesson, 0, len(lessons))
	for _, l := range lessons {
		list = append(list, toProto(l))
	}
	return &lessonpb.CourseLessonsList{Lessons: list}, nil
}

func (h *LessonHandler) RateLesson(ctx context.Context, req *lessonpb.RateLessonRequest) (*lessonpb.Lesson, error) {
	studentID := middleware.UserIDFromContext(ctx)
	if studentID == "" {
		return nil, status.Error(codes.Unauthenticated, "authentication required")
	}
	l, err := h.svc.RateLesson(ctx, req.GetLessonId(), studentID, req.GetRating())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(l), nil
}

func (h *LessonHandler) GetTutorBookedSlots(ctx context.Context, req *lessonpb.GetTutorBookedSlotsRequest) (*lessonpb.TutorBookedSlotsResponse, error) {
	if req.GetTutorId() == "" {
		return nil, status.Error(codes.InvalidArgument, "tutor_id is required")
	}
	slots, err := h.svc.GetTutorBookedSlots(ctx, req.GetTutorId())
	if err != nil {
		return nil, mapError(err)
	}
	result := make([]string, len(slots))
	for i, t := range slots {
		result[i] = t.UTC().Format(time.RFC3339)
	}
	return &lessonpb.TutorBookedSlotsResponse{ScheduledAts: result}, nil
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
			Status:    r.Status,
		})
	}
	return &lessonpb.AttendanceList{Records: records}, nil
}
