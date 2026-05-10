package handler

import (
	"net/http"

	"auth-service/proto/authpb"
)

type AuthHandler struct{ client authpb.AuthServiceClient }

func NewAuthHandler(c authpb.AuthServiceClient) *AuthHandler { return &AuthHandler{c} }

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req authpb.RegisterRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	resp, err := h.client.Register(r.Context(), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req authpb.LoginRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	resp, err := h.client.Login(r.Context(), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
