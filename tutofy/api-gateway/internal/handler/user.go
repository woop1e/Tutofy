package handler

import (
	"net/http"

	"user-service/proto/userpb"
)

type UserHandler struct{ client userpb.UserServiceClient }

func NewUserHandler(c userpb.UserServiceClient) *UserHandler { return &UserHandler{c} }

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetUser(tokenCtx(r), &userpb.GetUserRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var req userpb.UpdateUserRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.UserId = r.PathValue("id")
	resp, err := h.client.UpdateUser(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var req userpb.GetAllUsersRequest
	_ = decode(r, &req)
	resp, err := h.client.GetAllUsers(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteUser(tokenCtx(r), &userpb.DeleteUserRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
