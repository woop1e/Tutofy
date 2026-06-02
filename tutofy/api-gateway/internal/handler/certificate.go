package handler

import (
	"net/http"

	"certificate-service/proto/certificatepb"
)

type CertificateHandler struct {
	client certificatepb.CertificateServiceClient
}

func NewCertificateHandler(c certificatepb.CertificateServiceClient) *CertificateHandler {
	return &CertificateHandler{client: c}
}

func (h *CertificateHandler) IssueCertificate(w http.ResponseWriter, r *http.Request) {
	var req certificatepb.IssueCertificateRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.IssueCertificate(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *CertificateHandler) GetUserCertificates(w http.ResponseWriter, r *http.Request) {
	studentID := r.PathValue("id")
	resp, err := h.client.GetUserCertificates(tokenCtx(r), &certificatepb.GetUserCertificatesRequest{
		StudentId: studentID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CertificateHandler) GetCertificate(w http.ResponseWriter, r *http.Request) {
	studentID := r.PathValue("student_id")
	courseID  := r.PathValue("course_id")
	resp, err := h.client.GetCertificate(tokenCtx(r), &certificatepb.GetCertificateRequest{
		StudentId: studentID,
		CourseId:  courseID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CertificateHandler) RequestCertificate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CourseId string `json:"course_id"`
	}
	if err := decode(r, &body); err != nil || body.CourseId == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "course_id is required"})
		return
	}
	resp, err := h.client.RequestCertificate(tokenCtx(r), &certificatepb.RequestCertificateRequest{
		CourseId: body.CourseId,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *CertificateHandler) ApproveCertificate(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.ApproveCertificate(tokenCtx(r), &certificatepb.CertificateActionRequest{
		CertId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CertificateHandler) RejectCertificate(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.RejectCertificate(tokenCtx(r), &certificatepb.CertificateActionRequest{
		CertId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CertificateHandler) GetPendingCertificates(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetPendingCertificates(tokenCtx(r), &certificatepb.GetPendingCertificatesRequest{})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
