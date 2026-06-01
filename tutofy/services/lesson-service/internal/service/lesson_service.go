package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"lesson-service/internal/client"
	"lesson-service/internal/gcal"
	"lesson-service/internal/model"
	"lesson-service/internal/repository"

	"auth-service/proto/authpb"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
)

type lessonStatusEvent struct {
	CourseID   string   `json:"course_id"`
	LessonID   string   `json:"lesson_id"`
	StudentIDs []string `json:"student_ids"`
	Status     string   `json:"status"`
}

var statusName = map[model.LessonStatus]string{
	model.LessonStatusPlanned:             "PLANNED",
	model.LessonStatusCompleted:           "COMPLETED",
	model.LessonStatusCancelled:           "CANCELLED",
	model.LessonStatusPendingConfirmation: "PENDING_CONFIRMATION",
	model.LessonStatusAwaitingPayment:     "AWAITING_PAYMENT",
	model.LessonStatusPaymentExpired:      "PAYMENT_EXPIRED",
}

var (
	ErrForbidden        = errors.New("forbidden")
	ErrNotTutorOrAdmin  = errors.New("only tutors and admins can perform this action")
	ErrNotEnrolled      = errors.New("student is not enrolled in this course")
	ErrWrongStatus      = errors.New("lesson is not in the expected status")
	ErrApprovalRequired = errors.New("enrollment requires tutor approval first")
	ErrPaymentExpired   = errors.New("payment deadline has passed")
)

// AttendanceEntry is one per-student attendance record with status.
type AttendanceEntry struct {
	StudentID string
	Status    string // "present"|"absent"|"excused"
}

// LessonService is the business-logic contract.
type LessonService interface {
	CreateLesson(ctx context.Context, callerID, callerRole, courseID, title, videoLink string, scheduledAt time.Time, durationMinutes int32) (*model.Lesson, error)
	// BookIndividualLesson creates a 1-on-1 lesson request (status=PENDING_CONFIRMATION). studentID is stored so tutors can mark attendance later.
	BookIndividualLesson(ctx context.Context, tutorID, studentID, title string, scheduledAt time.Time, durationMinutes int32, price float64) (*model.Lesson, error)
	// ConfirmLesson lets the tutor accept a PENDING_CONFIRMATION lesson → moves it to AWAITING_PAYMENT.
	ConfirmLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	// DeclineLesson lets the tutor reject a PENDING_CONFIRMATION lesson → moves it to CANCELLED.
	DeclineLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	// ActivateLesson moves an AWAITING_PAYMENT lesson to PLANNED after student payment is confirmed.
	ActivateLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	GetLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error)
	GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string, limit, offset int32) ([]*model.Lesson, error)
	UpdateLessonStatus(ctx context.Context, callerID, callerRole, lessonID string, status model.LessonStatus) (*model.Lesson, error)
	SetVideoLink(ctx context.Context, callerID, callerRole, lessonID, videoLink string) (*model.Lesson, error)
	DeleteLesson(ctx context.Context, callerID, callerRole, lessonID string) error
	MarkAttendance(ctx context.Context, callerID, callerRole, lessonID string, entries []AttendanceEntry) error
	GetMySchedule(ctx context.Context, callerID, callerRole, fromDate, toDate string) ([]*model.Lesson, error)
	AddMaterial(ctx context.Context, callerID, callerRole, lessonID, fileID, title string) error
	GetLessonMaterials(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.LessonMaterial, error)
	GetAttendance(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.AttendanceRow, error)
	GetStudentLessons(ctx context.Context, studentID string) ([]*model.Lesson, error)
	GetTutorBookedSlots(ctx context.Context, tutorID string) ([]time.Time, error)
	GetTutorIndividualLessons(ctx context.Context, tutorID string) ([]*model.Lesson, error)
	ExpireOverduePayments(ctx context.Context) (int64, error)
}

type lessonService struct {
	repo       repository.LessonRepository
	enrollment client.EnrollmentClient
	course     client.CourseClient
	nc         *nats.Conn
	authClient authpb.AuthServiceClient
}

// NewLessonService creates a LessonService wired to all required dependencies.
func NewLessonService(
	repo repository.LessonRepository,
	enrollment client.EnrollmentClient,
	course client.CourseClient,
	nc *nats.Conn,
	authClient authpb.AuthServiceClient,
) LessonService {
	return &lessonService{
		repo:       repo,
		enrollment: enrollment,
		course:     course,
		nc:         nc,
		authClient: authClient,
	}
}

func (s *lessonService) CreateLesson(
	ctx context.Context,
	callerID, callerRole, courseID, title, videoLink string,
	scheduledAt time.Time,
	durationMinutes int32,
) (*model.Lesson, error) {
	if !isTutorOrAdmin(callerRole) {
		return nil, ErrNotTutorOrAdmin
	}

	if err := s.course.CourseExists(ctx, courseID); err != nil {
		return nil, err
	}

	lesson := &model.Lesson{
		ID:              uuid.NewString(),
		CourseID:        courseID,
		TutorID:         callerID,
		Title:           title,
		ScheduledAt:     scheduledAt,
		DurationMinutes: durationMinutes,
		VideoLink:       videoLink,
		Status:          model.LessonStatusPlanned,
	}

	if err := s.repo.CreateLesson(ctx, lesson); err != nil {
		return nil, err
	}

	// Notify progress-service for all enrolled students.
	go s.notifyProgress(ctx, lesson.CourseID, lesson.ID, model.LessonStatusPlanned)

	return lesson, nil
}

func (s *lessonService) BookIndividualLesson(
	ctx context.Context,
	tutorID, studentID, title string,
	scheduledAt time.Time,
	durationMinutes int32,
	price float64,
) (*model.Lesson, error) {
	lesson := &model.Lesson{
		ID:              uuid.NewString(),
		CourseID:        "",
		TutorID:         tutorID,
		StudentID:       studentID,
		Title:           title,
		ScheduledAt:     scheduledAt,
		DurationMinutes: durationMinutes,
		VideoLink:       "",
		Status:          model.LessonStatusPendingConfirmation,
		Price:           price,
	}
	if err := s.repo.CreateLesson(ctx, lesson); err != nil {
		return nil, err
	}
	if studentID != "" {
		_ = s.repo.UpsertAttendance(ctx, lesson.ID, studentID, "absent")
	}
	return lesson, nil
}

func (s *lessonService) ConfirmLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return nil, ErrForbidden
	}
	if lesson.Status != model.LessonStatusPendingConfirmation {
		return nil, ErrWrongStatus
	}

	// Payment deadline: 2 hours from now OR 3 hours before scheduled time, whichever is sooner.
	now := time.Now()
	deadline := now.Add(2 * time.Hour)
	late := lesson.ScheduledAt.Add(-3 * time.Hour)
	if late.Before(deadline) {
		deadline = late
	}
	if deadline.Before(now) {
		deadline = now.Add(30 * time.Minute)
	}

	updated, err := s.repo.UpdateLessonStatusAndDeadline(ctx, lessonID, model.LessonStatusAwaitingPayment, deadline)
	if err != nil {
		return nil, err
	}

	// Try to auto-generate a Google Meet link with "[Pending Payment]" prefix.
	if s.authClient != nil {
		go s.tryCreateMeetLink(context.Background(), lesson)
	}

	go s.publishConfirmed(lesson)
	return updated, nil
}

func (s *lessonService) tryCreateMeetLink(ctx context.Context, lesson *model.Lesson) {
	tokResp, err := s.authClient.GetGoogleToken(ctx, &authpb.GetGoogleTokenRequest{UserId: lesson.TutorID})
	if err != nil {
		return // tutor hasn't connected Google account — silently skip
	}
	calendarTitle := "[Pending Payment] " + lesson.Title
	meetURL, eventID, err := gcal.CreateMeetLink(tokResp.GetAccessToken(), calendarTitle, lesson.ScheduledAt, lesson.DurationMinutes)
	if err != nil {
		log.Printf("gcal: could not create Meet link for lesson %s: %v", lesson.ID, err)
		return
	}
	if _, err := s.repo.UpdateVideoLink(ctx, lesson.ID, meetURL); err != nil {
		log.Printf("gcal: could not save Meet link for lesson %s: %v", lesson.ID, err)
	}
	if eventID != "" {
		if err := s.repo.SetCalendarEventID(ctx, lesson.ID, eventID); err != nil {
			log.Printf("gcal: could not save calendar event ID for lesson %s: %v", lesson.ID, err)
		}
	}
}

func (s *lessonService) DeclineLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return nil, ErrForbidden
	}
	if lesson.Status != model.LessonStatusPendingConfirmation {
		return nil, ErrWrongStatus
	}
	updated, err := s.repo.UpdateLessonStatus(ctx, lessonID, model.LessonStatusCancelled)
	if err != nil {
		return nil, err
	}
	go s.publishDeclined(lesson)
	return updated, nil
}

func (s *lessonService) ActivateLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	// Only the student who booked, or an admin, may activate after payment.
	if callerRole != "admin" && lesson.StudentID != callerID {
		return nil, ErrForbidden
	}
	if lesson.Status == model.LessonStatusPaymentExpired {
		return nil, ErrPaymentExpired
	}
	if lesson.Status != model.LessonStatusAwaitingPayment {
		return nil, ErrWrongStatus
	}
	updated, err := s.repo.UpdateLessonStatus(ctx, lessonID, model.LessonStatusPlanned)
	if err != nil {
		return nil, err
	}
	// Update calendar event title to [Confirmed] asynchronously.
	if s.authClient != nil && lesson.CalendarEventID != "" {
		go func() {
			tokResp, err := s.authClient.GetGoogleToken(context.Background(), &authpb.GetGoogleTokenRequest{UserId: lesson.TutorID})
			if err != nil {
				return
			}
			confirmedTitle := "[Confirmed] " + lesson.Title
			if err := gcal.UpdateEventSummary(tokResp.GetAccessToken(), lesson.CalendarEventID, confirmedTitle); err != nil {
				log.Printf("gcal: could not update event title for lesson %s: %v", lesson.ID, err)
			}
		}()
	}
	return updated, nil
}

func (s *lessonService) GetLesson(ctx context.Context, callerID, callerRole, lessonID string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	if err := s.assertCanView(ctx, callerID, callerRole, lesson.CourseID); err != nil {
		return nil, err
	}

	return lesson, nil
}

func (s *lessonService) GetCourseLessons(ctx context.Context, callerID, callerRole, courseID string, limit, offset int32) ([]*model.Lesson, error) {
	if err := s.assertCanView(ctx, callerID, callerRole, courseID); err != nil {
		return nil, err
	}
	return s.repo.GetCourseLessons(ctx, courseID, limit, offset)
}

func (s *lessonService) UpdateLessonStatus(
	ctx context.Context,
	callerID, callerRole, lessonID string,
	status model.LessonStatus,
) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	// Only the tutor who created the lesson or an admin may change its status.
	if callerRole != "admin" && lesson.TutorID != callerID {
		return nil, ErrForbidden
	}

	updated, err := s.repo.UpdateLessonStatus(ctx, lessonID, status)
	if err != nil {
		return nil, err
	}

	// Notify progress-service for all enrolled students.
	go s.notifyProgress(ctx, updated.CourseID, updated.ID, status)

	return updated, nil
}

func (s *lessonService) SetVideoLink(ctx context.Context, callerID, callerRole, lessonID, videoLink string) (*model.Lesson, error) {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return nil, ErrForbidden
	}
	return s.repo.UpdateVideoLink(ctx, lessonID, videoLink)
}

func (s *lessonService) DeleteLesson(ctx context.Context, callerID, callerRole, lessonID string) error {
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}

	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}

	return s.repo.DeleteLesson(ctx, lessonID)
}

// --- helpers ---

// assertCanView checks whether the caller is allowed to view lessons in a course.
// Tutors, admins and parents can always view. Students must be enrolled.
func (s *lessonService) assertCanView(ctx context.Context, callerID, callerRole, courseID string) error {
	switch callerRole {
	case "tutor", "admin", "parent":
		return nil
	case "student":
		enrolled, err := s.enrollment.IsEnrolled(ctx, callerID, courseID)
		if err != nil {
			return err
		}
		if !enrolled {
			return ErrNotEnrolled
		}
		return nil
	default:
		return ErrForbidden
	}
}

// notifyProgress publishes a lesson.status_changed event to NATS with all
// enrolled student IDs included so progress-service can process without
// needing its own enrollment-service client.
func (s *lessonService) notifyProgress(ctx context.Context, courseID, lessonID string, status model.LessonStatus) {
	if s.nc == nil {
		return
	}
	studentIDs, err := s.enrollment.GetEnrolledStudentIDs(ctx, courseID)
	if err != nil || len(studentIDs) == 0 {
		return
	}
	ev := lessonStatusEvent{
		CourseID:   courseID,
		LessonID:   lessonID,
		StudentIDs: studentIDs,
		Status:     statusName[status],
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if err := s.nc.Publish("lesson.status_changed", data); err != nil {
		log.Printf("warn: NATS publish lesson.status_changed failed: %v", err)
	}
}

func isTutorOrAdmin(role string) bool {
	return role == "tutor" || role == "admin"
}

type lessonConfirmedEvent struct {
	LessonID    string  `json:"lesson_id"`
	StudentID   string  `json:"student_id"`
	TutorID     string  `json:"tutor_id"`
	Title       string  `json:"title"`
	ScheduledAt string  `json:"scheduled_at"`
	Price       float64 `json:"price"`
}

type lessonDeclinedEvent struct {
	LessonID  string `json:"lesson_id"`
	StudentID string `json:"student_id"`
	TutorID   string `json:"tutor_id"`
	Title     string `json:"title"`
}

func (s *lessonService) publishConfirmed(lesson *model.Lesson) {
	if s.nc == nil {
		return
	}
	ev := lessonConfirmedEvent{
		LessonID:    lesson.ID,
		StudentID:   lesson.StudentID,
		TutorID:     lesson.TutorID,
		Title:       lesson.Title,
		ScheduledAt: lesson.ScheduledAt.UTC().Format(time.RFC3339),
		Price:       lesson.Price,
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if err := s.nc.Publish("lesson.confirmed", data); err != nil {
		log.Printf("warn: NATS publish lesson.confirmed failed: %v", err)
	}
}

func (s *lessonService) publishDeclined(lesson *model.Lesson) {
	if s.nc == nil {
		return
	}
	ev := lessonDeclinedEvent{
		LessonID:  lesson.ID,
		StudentID: lesson.StudentID,
		TutorID:   lesson.TutorID,
		Title:     lesson.Title,
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if err := s.nc.Publish("lesson.declined", data); err != nil {
		log.Printf("warn: NATS publish lesson.declined failed: %v", err)
	}
}

func (s *lessonService) MarkAttendance(ctx context.Context, callerID, callerRole, lessonID string, entries []AttendanceEntry) error {
	if !isTutorOrAdmin(callerRole) {
		return ErrNotTutorOrAdmin
	}
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}
	for _, e := range entries {
		status := e.Status
		if status == "" {
			status = "absent"
		}
		if err := s.repo.UpsertAttendance(ctx, lessonID, e.StudentID, status); err != nil {
			return err
		}
	}
	return nil
}

func (s *lessonService) GetMySchedule(ctx context.Context, callerID, callerRole, fromDate, toDate string) ([]*model.Lesson, error) {
	var courseIDs []string
	var tutorID string

	switch callerRole {
	case "tutor", "admin":
		tutorID = callerID
	case "student":
		ids, err := s.enrollment.GetEnrolledCourseIDs(ctx, callerID)
		if err != nil {
			return nil, err
		}
		courseIDs = ids
	default:
		return nil, ErrForbidden
	}

	return s.repo.GetLessonsInRange(ctx, courseIDs, tutorID, fromDate, toDate)
}

func (s *lessonService) AddMaterial(ctx context.Context, callerID, callerRole, lessonID, fileID, title string) error {
	if !isTutorOrAdmin(callerRole) {
		return ErrNotTutorOrAdmin
	}
	lesson, err := s.repo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if callerRole != "admin" && lesson.TutorID != callerID {
		return ErrForbidden
	}
	id := uuid.NewString()
	return s.repo.AddMaterial(ctx, id, lessonID, fileID, title)
}

func (s *lessonService) GetLessonMaterials(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.LessonMaterial, error) {
	return s.repo.GetLessonMaterials(ctx, lessonID)
}


func (s *lessonService) GetAttendance(ctx context.Context, callerID, callerRole, lessonID string) ([]*repository.AttendanceRow, error) {
	return s.repo.GetAttendance(ctx, lessonID, callerID, callerRole)
}

func (s *lessonService) GetStudentLessons(ctx context.Context, studentID string) ([]*model.Lesson, error) {
	return s.repo.GetStudentLessons(ctx, studentID)
}

func (s *lessonService) GetTutorBookedSlots(ctx context.Context, tutorID string) ([]time.Time, error) {
	return s.repo.GetTutorBookedSlots(ctx, tutorID)
}

func (s *lessonService) GetTutorIndividualLessons(ctx context.Context, tutorID string) ([]*model.Lesson, error) {
	return s.repo.GetTutorIndividualLessons(ctx, tutorID)
}

func (s *lessonService) ExpireOverduePayments(ctx context.Context) (int64, error) {
	return s.repo.ExpireOverduePayments(ctx)
}
