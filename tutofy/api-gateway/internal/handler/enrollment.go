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

func (h *EnrollmentHandler) RequestEnrollment(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.RequestEnrollment(tokenCtx(r), &enrollmentpb.RequestEnrollmentRequest{
		CourseId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *EnrollmentHandler) GetCourseEnrollmentRequests(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourseEnrollmentRequests(tokenCtx(r), &enrollmentpb.CourseRequest{
		CourseId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *EnrollmentHandler) ApproveEnrollmentRequest(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.ApproveEnrollmentRequest(tokenCtx(r), &enrollmentpb.EnrollmentRequestActionRequest{
		RequestId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EnrollmentHandler) RejectEnrollmentRequest(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.RejectEnrollmentRequest(tokenCtx(r), &enrollmentpb.EnrollmentRequestActionRequest{
		RequestId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EnrollmentHandler) CountEnrollments(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.CountEnrollments(tokenCtx(r), &enrollmentpb.CourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, map[string]int64{"count": resp.GetCount()})
}
