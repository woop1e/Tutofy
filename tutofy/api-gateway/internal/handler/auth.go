package handler

import (
	"net/http"

	"auth-service/proto/authpb"
	"user-service/proto/userpb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
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

	resp, err := h.auth.Register(r.Context(), &req)
	if err != nil {
		errResp(w, err)
		return
	}

	// Create the user profile in user-service using the setup token (internal use only).
	if resp.GetToken() != "" {
		validated, valErr := h.auth.ValidateToken(r.Context(), &authpb.TokenRequest{Token: resp.GetToken()})
		if valErr == nil && validated.GetUserId() != "" {
			md := metadata.New(map[string]string{"authorization": "Bearer " + resp.GetToken()})
			userCtx := metadata.NewOutgoingContext(r.Context(), md)
			_, _ = h.user.CreateUser(userCtx, &userpb.CreateUserRequest{
				Id:    validated.GetUserId(),
				Email: req.GetEmail(),
				Name:  req.GetName(),
				Role:  req.GetRole(),
			})
		}
	}

	// Never expose the setup token to the client.
	jsonResp(w, http.StatusCreated, map[string]interface{}{
		"needs_verification": resp.GetNeedsVerification(),
		"message":            resp.GetMessage(),
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req authpb.LoginRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	resp, err := h.auth.Login(r.Context(), &req)
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.PermissionDenied {
			jsonResp(w, http.StatusForbidden, map[string]string{"error": "email not verified", "code": "EMAIL_NOT_VERIFIED"})
			return
		}
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if err := decode(r, &body); err != nil || body.Token == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "token is required"})
		return
	}

	resp, err := h.auth.VerifyEmail(r.Context(), &authpb.VerifyEmailRequest{Token: body.Token})
	if err != nil {
		errResp(w, err)
		return
	}

	jsonResp(w, http.StatusOK, resp)
}

func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := decode(r, &body); err != nil || body.Email == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "email is required"})
		return
	}

	_, err := h.auth.ResendVerification(r.Context(), &authpb.ResendVerificationRequest{Email: body.Email})
	if err != nil {
		errResp(w, err)
		return
	}

	jsonResp(w, http.StatusOK, map[string]string{"message": "verification email sent"})
}
