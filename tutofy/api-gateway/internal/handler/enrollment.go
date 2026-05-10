package handler

import (
	"net/http"

	"enrollment-service/proto/enrollmentpb"
)

type EnrollmentHandler struct{ client enrollmentpb.EnrollmentServiceClient }

func NewEnrollmentHandler(c enrollmentpb.EnrollmentServiceClient) *EnrollmentHandler {
	return &EnrollmentHandler{c}
}

func (h *EnrollmentHandler) EnrollUser(w http.ResponseWriter, r *http.Request) {
	var req enrollmentpb.EnrollRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.EnrollUser(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *EnrollmentHandler) UnenrollUser(w http.ResponseWriter, r *http.Request) {
	var req enrollmentpb.UnenrollRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	_, err := h.client.UnenrollUser(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EnrollmentHandler) GetUserEnrollments(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetUserEnrollments(tokenCtx(r), &enrollmentpb.UserRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *EnrollmentHandler) GetCourseEnrollments(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourseEnrollments(tokenCtx(r), &enrollmentpb.CourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
