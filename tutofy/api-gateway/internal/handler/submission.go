package handler

import (
	"net/http"

	"submission-service/proto/submissionpb"
)

type SubmissionHandler struct{ client submissionpb.SubmissionServiceClient }

func NewSubmissionHandler(c submissionpb.SubmissionServiceClient) *SubmissionHandler {
	return &SubmissionHandler{c}
}

func (h *SubmissionHandler) SubmitAssignment(w http.ResponseWriter, r *http.Request) {
	var body struct {
		AssignmentID string `json:"assignment_id"`
		Content      string `json:"content"`
		FileID       string `json:"file_id"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if body.AssignmentID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "assignment_id is required"})
		return
	}
	resp, err := h.client.SubmitAssignment(tokenCtx(r), &submissionpb.SubmitAssignmentRequest{
		AssignmentId: body.AssignmentID,
		Content:      body.Content,
		FileId:       body.FileID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *SubmissionHandler) GetSubmission(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetSubmission(tokenCtx(r), &submissionpb.GetSubmissionRequest{
		AssignmentId: r.PathValue("assignmentId"),
		StudentId:    r.PathValue("studentId"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *SubmissionHandler) GetMySubmission(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromToken(r)
	if userID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	resp, err := h.client.GetSubmission(tokenCtx(r), &submissionpb.GetSubmissionRequest{
		AssignmentId: r.PathValue("assignmentId"),
		StudentId:    userID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *SubmissionHandler) GetAssignmentSubmissions(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAssignmentSubmissions(tokenCtx(r), &submissionpb.GetAssignmentSubmissionsRequest{
		AssignmentId: r.PathValue("id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
