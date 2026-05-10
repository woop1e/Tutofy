package handler

import (
	"net/http"

	"grading-service/proto/gradingpb"
)

type GradingHandler struct{ client gradingpb.GradingServiceClient }

func NewGradingHandler(c gradingpb.GradingServiceClient) *GradingHandler { return &GradingHandler{c} }

func (h *GradingHandler) SubmitGrade(w http.ResponseWriter, r *http.Request) {
	var req gradingpb.SubmitGradeRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.SubmitGrade(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *GradingHandler) GetStudentGrades(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetStudentGrades(tokenCtx(r), &gradingpb.StudentRequest{StudentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *GradingHandler) GetAssignmentGrades(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAssignmentGrades(tokenCtx(r), &gradingpb.AssignmentRequest{AssignmentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
