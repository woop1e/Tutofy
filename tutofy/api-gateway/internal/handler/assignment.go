package handler

import (
	"net/http"

	"assignment-service/proto/assignmentpb"
)

type AssignmentHandler struct{ client assignmentpb.AssignmentServiceClient }

func NewAssignmentHandler(c assignmentpb.AssignmentServiceClient) *AssignmentHandler {
	return &AssignmentHandler{c}
}

func (h *AssignmentHandler) CreateAssignment(w http.ResponseWriter, r *http.Request) {
	var req assignmentpb.CreateAssignmentRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreateAssignment(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *AssignmentHandler) GetAssignment(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAssignment(tokenCtx(r), &assignmentpb.GetAssignmentRequest{AssignmentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *AssignmentHandler) GetAssignmentsByCourse(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAssignmentsByCourse(tokenCtx(r), &assignmentpb.CourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *AssignmentHandler) UpdateAssignment(w http.ResponseWriter, r *http.Request) {
	var req assignmentpb.UpdateAssignmentRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.AssignmentId = r.PathValue("id")
	resp, err := h.client.UpdateAssignment(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *AssignmentHandler) DeleteAssignment(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteAssignment(tokenCtx(r), &assignmentpb.DeleteAssignmentRequest{AssignmentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
