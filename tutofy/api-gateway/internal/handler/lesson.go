package handler

import (
	"net/http"
	"time"

	"lesson-service/proto/lessonpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type LessonHandler struct{ client lessonpb.LessonServiceClient }

func NewLessonHandler(c lessonpb.LessonServiceClient) *LessonHandler { return &LessonHandler{c} }

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
	t, err := time.Parse(time.RFC3339, body.ScheduledAt)
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
