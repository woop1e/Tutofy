package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"enrollment-service/proto/enrollmentpb"
	"lesson-service/proto/lessonpb"
	"notification-service/proto/notificationpb"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type LessonHandler struct {
	client        lessonpb.LessonServiceClient
	notifClient   notificationpb.NotificationServiceClient
	enrollClient  enrollmentpb.EnrollmentServiceClient
}

func NewLessonHandler(c lessonpb.LessonServiceClient, nc notificationpb.NotificationServiceClient, ec enrollmentpb.EnrollmentServiceClient) *LessonHandler {
	return &LessonHandler{client: c, notifClient: nc, enrollClient: ec}
}

type createLessonBody struct {
	CourseId        string `json:"course_id"`
	Title           string `json:"title"`
	VideoLink       string `json:"video_link"`
	ScheduledAt     string `json:"scheduled_at"` // RFC3339
	DurationMinutes int32  `json:"duration_minutes"`
}

func (h *LessonHandler) CreateLesson(w http.ResponseWriter, r *http.Request) {
	var body createLessonBody
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	t, err := time.Parse(time.RFC3339Nano, body.ScheduledAt)
	if err != nil {
		t, err = time.Parse(time.RFC3339, body.ScheduledAt)
	}
	if err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "scheduled_at must be RFC3339"})
		return
	}
	resp, err := h.client.CreateLesson(tokenCtx(r), &lessonpb.CreateLessonRequest{
		CourseId:        body.CourseId,
		Title:           body.Title,
		VideoLink:       body.VideoLink,
		ScheduledAt:     timestamppb.New(t),
		DurationMinutes: body.DurationMinutes,
	})
	if err != nil {
		errResp(w, err)
		return
	}

	// Notify enrolled students when a course lesson is created.
	if body.CourseId != "" && h.notifClient != nil && h.enrollClient != nil {
		go func() {
			enrResp, err := h.enrollClient.GetCourseEnrollments(context.Background(), &enrollmentpb.CourseRequest{CourseId: body.CourseId})
			if err != nil {
				return
			}
			msg := fmt.Sprintf("New lesson scheduled: \"%s\" on %s", body.Title, t.Format("Jan 2, 2006 at 15:04"))
			for _, enr := range enrResp.GetEnrollments() {
				uid := enr.GetUserId()
				if uid == "" {
					continue
				}
				_, _ = h.notifClient.NotifyUser(context.Background(), &notificationpb.NotifyUserRequest{
					UserId:  uid,
					Type:    3, // NOTIFICATION_TYPE_NEW_LESSON
					Message: msg,
				})
			}
		}()
	}

	jsonResp(w, http.StatusCreated, resp)
}

func (h *LessonHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetLesson(tokenCtx(r), &lessonpb.GetLessonRequest{LessonId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *LessonHandler) GetCourseLessons(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourseLessons(tokenCtx(r), &lessonpb.GetCourseLessonsRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

var lessonStatusMap = map[string]lessonpb.LessonStatus{
	"planned":   lessonpb.LessonStatus_LESSON_STATUS_PLANNED,
	"completed": lessonpb.LessonStatus_LESSON_STATUS_COMPLETED,
	"cancelled": lessonpb.LessonStatus_LESSON_STATUS_CANCELLED,
}

func (h *LessonHandler) UpdateLessonStatus(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Status string `json:"status"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	st, ok := lessonStatusMap[body.Status]
	if !ok {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "status must be planned|completed|cancelled"})
		return
	}
	resp, err := h.client.UpdateLessonStatus(tokenCtx(r), &lessonpb.UpdateLessonStatusRequest{
		LessonId: r.PathValue("id"),
		Status:   st,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *LessonHandler) GetMySchedule(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	resp, err := h.client.GetMySchedule(tokenCtx(r), &lessonpb.GetScheduleRequest{
		FromDate: q.Get("from"),
		ToDate:   q.Get("to"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

// BookLesson lets an authenticated student (or any user) book a 1-on-1 lesson with a tutor.
// It creates the lesson and immediately notifies the tutor.
func (h *LessonHandler) BookLesson(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TutorId         string  `json:"tutor_id"`
		Title           string  `json:"title"`
		ScheduledAt     string  `json:"scheduled_at"` // RFC3339
		DurationMinutes int32   `json:"duration_minutes"`
		Price           float64 `json:"price"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if body.TutorId == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "tutor_id is required"})
		return
	}
	t, err := time.Parse(time.RFC3339Nano, body.ScheduledAt)
	if err != nil {
		t, err = time.Parse(time.RFC3339, body.ScheduledAt)
	}
	if err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "scheduled_at must be RFC3339"})
		return
	}

	// Build outgoing context: forward student JWT + add x-tutor-id for lesson service.
	outMD := metadata.New(map[string]string{"x-tutor-id": body.TutorId})
	base := tokenCtx(r)
	// Merge any existing metadata with x-tutor-id.
	if existing, ok := metadata.FromOutgoingContext(base); ok {
		for k, v := range existing {
			outMD[k] = v
		}
	}
	ctx := metadata.NewOutgoingContext(base, outMD)

	durationMinutes := body.DurationMinutes
	if durationMinutes <= 0 {
		durationMinutes = 60
	}

	resp, err := h.client.CreateLesson(ctx, &lessonpb.CreateLessonRequest{
		CourseId:        "", // empty = individual lesson
		Title:           body.Title,
		ScheduledAt:     timestamppb.New(t),
		DurationMinutes: durationMinutes,
	})
	if err != nil {
		errResp(w, err)
		return
	}

	// Notify the tutor asynchronously.
	if h.notifClient != nil {
		go func() {
			msg := fmt.Sprintf("New lesson booked: \"%s\" on %s", body.Title, t.Format("Jan 2, 2006 at 15:04"))
			_, _ = h.notifClient.NotifyUser(context.Background(), &notificationpb.NotifyUserRequest{
				UserId:  body.TutorId,
				Type:    3, // NOTIFICATION_TYPE_NEW_LESSON
				Message: msg,
			})
		}()
	}

	jsonResp(w, http.StatusCreated, resp)
}

func (h *LessonHandler) SetVideoLink(w http.ResponseWriter, r *http.Request) {
	var body struct {
		VideoLink string `json:"video_link"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	lessonID := r.PathValue("id")
	resp, err := h.client.SetVideoLink(tokenCtx(r), &lessonpb.SetVideoLinkRequest{
		LessonId:  lessonID,
		VideoLink: body.VideoLink,
	})
	if err != nil {
		errResp(w, err)
		return
	}

	// Notify all students who are in this lesson's attendance list.
	if body.VideoLink != "" && h.notifClient != nil {
		go func() {
			atRes, err := h.client.GetAttendance(context.Background(), &lessonpb.GetAttendanceRequest{LessonId: lessonID})
			if err != nil {
				return
			}
			msg := fmt.Sprintf("Meeting link is ready for your lesson \"%s\". You can now join the session.", resp.GetTitle())
			for _, rec := range atRes.GetRecords() {
				uid := rec.GetStudentId()
				if uid == "" {
					continue
				}
				_, _ = h.notifClient.NotifyUser(context.Background(), &notificationpb.NotifyUserRequest{
					UserId:  uid,
					Type:    3, // NOTIFICATION_TYPE_NEW_LESSON
					Message: msg,
				})
			}
		}()
	}

	jsonResp(w, http.StatusOK, resp)
}

// GetTutorIndividualLessons returns all individual (non-course) lessons booked with the authenticated tutor.
func (h *LessonHandler) GetTutorIndividualLessons(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetTutorIndividualLessons(tokenCtx(r), &lessonpb.Empty{})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

// GetTutorBookedSlots returns the upcoming booked hour-slots for a tutor.
// This is a public endpoint — no auth required — used by the marketplace profile page.
func (h *LessonHandler) GetTutorBookedSlots(w http.ResponseWriter, r *http.Request) {
	tutorID := r.PathValue("id")
	resp, err := h.client.GetTutorBookedSlots(context.Background(), &lessonpb.GetTutorBookedSlotsRequest{TutorId: tutorID})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

// GetMyLessons returns the authenticated student's individual (non-course) lessons.
func (h *LessonHandler) GetMyLessons(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetStudentLessons(tokenCtx(r), &lessonpb.GetStudentLessonsRequest{})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *LessonHandler) DeleteLesson(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteLesson(tokenCtx(r), &lessonpb.DeleteLessonRequest{LessonId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *LessonHandler) AddMaterial(w http.ResponseWriter, r *http.Request) {
	var req lessonpb.AddMaterialRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.LessonId = r.PathValue("id")
	resp, err := h.client.AddMaterial(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *LessonHandler) GetLessonMaterials(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetLessonMaterials(tokenCtx(r), &lessonpb.GetLessonMaterialsRequest{LessonId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *LessonHandler) GetAttendance(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAttendance(tokenCtx(r), &lessonpb.GetAttendanceRequest{LessonId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *LessonHandler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Records []struct {
			StudentID string `json:"student_id"`
			Status    string `json:"status"`
		} `json:"records"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	lessonID := r.PathValue("id")
	records := make([]*lessonpb.AttendanceStatusRecord, len(body.Records))
	for i, rec := range body.Records {
		records[i] = &lessonpb.AttendanceStatusRecord{
			StudentId: rec.StudentID,
			Status:    rec.Status,
		}
	}
	_, err := h.client.MarkAttendance(tokenCtx(r), &lessonpb.MarkAttendanceRequest{
		LessonId: lessonID,
		Records:  records,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "ok"})
}
