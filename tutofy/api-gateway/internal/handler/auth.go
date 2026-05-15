package handler

import (
	"net/http"

	"auth-service/proto/authpb"
	"user-service/proto/userpb"
	"google.golang.org/grpc/metadata"
)

type AuthHandler struct {
	auth authpb.AuthServiceClient
	user userpb.UserServiceClient
}

func NewAuthHandler(auth authpb.AuthServiceClient, user userpb.UserServiceClient) *AuthHandler {
	return &AuthHandler{auth: auth, user: user}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req authpb.RegisterRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// 1. Create auth account
	resp, err := h.auth.Register(r.Context(), &req)
	if err != nil {
		errResp(w, err)
		return
	}

	// 2. Validate token to get the assigned user_id
	validated, err := h.auth.ValidateToken(r.Context(), &authpb.TokenRequest{Token: resp.GetToken()})
	if err == nil && validated.GetUserId() != "" {
		// 3. Create user profile in user-service — pass the new token so the auth interceptor accepts it
		md := metadata.New(map[string]string{"authorization": "Bearer " + resp.GetToken()})
		userCtx := metadata.NewOutgoingContext(r.Context(), md)
		_, _ = h.user.CreateUser(userCtx, &userpb.CreateUserRequest{
			Id:    validated.GetUserId(),
			Email: req.GetEmail(),
			Name:  req.GetName(),
			Role:  req.GetRole(),
		})
	}

	jsonResp(w, http.StatusCreated, resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req authpb.LoginRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	resp, err := h.auth.Login(r.Context(), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
