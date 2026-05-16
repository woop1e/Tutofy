package handler

import (
	"net/http"

	"course-service/proto/coursepb"
	"progress-service/proto/progresspb"
)

type ProgressHandler struct {
	client      progresspb.ProgressServiceClient
	courseClient coursepb.CourseServiceClient
}

func NewProgressHandler(c progresspb.ProgressServiceClient, cc coursepb.CourseServiceClient) *ProgressHandler {
	return &ProgressHandler{client: c, courseClient: cc}
}

type progressEnriched struct {
	StudentID           string  `json:"student_id"`
	CourseID            string  `json:"course_id"`
	CompletedLessons    int32   `json:"completed_lessons"`
	TotalLessons        int32   `json:"total_lessons"`
	TotalPlannedLessons int32   `json:"total_planned_lessons"`
	TotalWeeks          int32   `json:"total_weeks"`
	ReleaseType         string  `json:"release_type"`
	AvailablePct        float64 `json:"available_pct"`
	OverallPct          float64 `json:"overall_pct"`
	Percentage          float64 `json:"percentage"`
}

// MarkLessonComplete lets a student record their own lesson completion.
// POST /lessons/{id}/complete  body: {"course_id":"..."}
func (h *ProgressHandler) MarkLessonComplete(w http.ResponseWriter, r *http.Request) {
	studentID := userIDFromToken(r)
	if studentID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	var body struct {
		CourseID string `json:"course_id"`
	}
	if err := decode(r, &body); err != nil || body.CourseID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "course_id is required"})
		return
	}
	_, err := h.client.RecordLessonEvent(tokenCtx(r), &progresspb.RecordLessonEventRequest{
		StudentId: studentID,
		CourseId:  body.CourseID,
		LessonId:  r.PathValue("id"),
		Status:    progresspb.LessonStatus_LESSON_STATUS_COMPLETED,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *ProgressHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	studentID := r.PathValue("student_id")
	courseID := r.PathValue("course_id")

	resp, err := h.client.GetProgress(tokenCtx(r), &progresspb.GetProgressRequest{
		StudentId: studentID,
		CourseId:  courseID,
	})
	if err != nil {
		errResp(w, err)
		return
	}

	var availablePct float64
	if resp.GetTotalLessons() > 0 {
		availablePct = float64(resp.GetCompletedLessons()) / float64(resp.GetTotalLessons()) * 100
	}

	e := &progressEnriched{
		StudentID:        resp.GetStudentId(),
		CourseID:         resp.GetCourseId(),
		CompletedLessons: resp.GetCompletedLessons(),
		TotalLessons:     resp.GetTotalLessons(),
		AvailablePct:     availablePct,
	}

	if h.courseClient != nil {
		if cr, err2 := h.courseClient.GetCourse(tokenCtx(r), &coursepb.GetCourseRequest{CourseId: courseID}); err2 == nil {
			e.TotalPlannedLessons = cr.GetTotalLessons()
			e.TotalWeeks = cr.GetTotalWeeks()
			e.ReleaseType = cr.GetReleaseType()
			if cr.GetTotalLessons() > 0 {
				e.OverallPct = float64(resp.GetCompletedLessons()) / float64(cr.GetTotalLessons()) * 100
			}
		}
	}

	if e.TotalPlannedLessons > 0 {
		e.Percentage = e.OverallPct
	} else {
		e.Percentage = availablePct
	}

	jsonResp(w, http.StatusOK, e)
}

func (h *ProgressHandler) GetCourseProgress(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourseProgress(tokenCtx(r), &progresspb.GetCourseProgressRequest{
		CourseId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
