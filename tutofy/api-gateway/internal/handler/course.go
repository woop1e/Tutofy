package handler

import (
	"net/http"

	"course-service/proto/coursepb"
)

type CourseHandler struct{ client coursepb.CourseServiceClient }

func NewCourseHandler(c coursepb.CourseServiceClient) *CourseHandler { return &CourseHandler{c} }

func (h *CourseHandler) CreateCourse(w http.ResponseWriter, r *http.Request) {
	var req coursepb.CreateCourseRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreateCourse(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *CourseHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourse(tokenCtx(r), &coursepb.GetCourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) GetAllCourses(w http.ResponseWriter, r *http.Request) {
	var req coursepb.GetAllCoursesRequest
	_ = decode(r, &req)
	resp, err := h.client.GetAllCourses(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) UpdateCourse(w http.ResponseWriter, r *http.Request) {
	var req coursepb.UpdateCourseRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.CourseId = r.PathValue("id")
	resp, err := h.client.UpdateCourse(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) DeleteCourse(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteCourse(tokenCtx(r), &coursepb.DeleteCourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
