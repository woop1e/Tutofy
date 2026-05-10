package handler

import (
	"net/http"

	"progress-service/proto/progresspb"
)

type ProgressHandler struct{ client progresspb.ProgressServiceClient }

func NewProgressHandler(c progresspb.ProgressServiceClient) *ProgressHandler {
	return &ProgressHandler{c}
}

func (h *ProgressHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetProgress(tokenCtx(r), &progresspb.GetProgressRequest{
		StudentId: r.PathValue("student_id"),
		CourseId:  r.PathValue("course_id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
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
