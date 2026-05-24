package handler

import (
	"auth-service/internal/repository"
	"auth-service/internal/service"
	"auth-service/proto/authpb"
	"context"
	"regexp"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var emailRE = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type AuthHandler struct {
	authpb.UnimplementedAuthServiceServer
	svc  *service.AuthService
	repo *repository.UserRepository
}

func NewAuthHandler(svc *service.AuthService, repo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{svc: svc, repo: repo}
}

func (h *AuthHandler) Register(ctx context.Context, req *authpb.RegisterRequest) (*authpb.AuthResponse, error) {
	switch {
	case req.Name == "":
		return nil, status.Error(codes.InvalidArgument, "name is required")
	case req.Email == "":
		return nil, status.Error(codes.InvalidArgument, "email is required")
	case !emailRE.MatchString(req.Email):
		return nil, status.Error(codes.InvalidArgument, "invalid email format")
	case req.Password == "":
		return nil, status.Error(codes.InvalidArgument, "password is required")
	case len(req.Password) < 8:
		return nil, status.Error(codes.InvalidArgument, "password must be at least 8 characters")
	case req.Role == "":
		return nil, status.Error(codes.InvalidArgument, "role is required")
	}

	token, err := h.svc.Register(req.Email, req.Password, req.Name, req.Role)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &authpb.AuthResponse{Token: token, Message: "registered successfully"}, nil
}

func (h *AuthHandler) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.AuthResponse, error) {
	switch {
	case req.Email == "":
		return nil, status.Error(codes.InvalidArgument, "email is required")
	case !emailRE.MatchString(req.Email):
		return nil, status.Error(codes.InvalidArgument, "invalid email format")
	case req.Password == "":
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	token, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	return &authpb.AuthResponse{Token: token, Message: "login successful"}, nil
}

func (h *AuthHandler) ValidateToken(ctx context.Context, req *authpb.TokenRequest) (*authpb.ValidateResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	userID, role, err := h.svc.ValidateJWT(req.Token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	return &authpb.ValidateResponse{UserId: userID, Role: role}, nil
}

func (h *AuthHandler) StoreGoogleToken(ctx context.Context, req *authpb.StoreGoogleTokenRequest) (*authpb.StoreGoogleTokenResponse, error) {
	if req.UserId == "" || req.AccessToken == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id and access_token are required")
	}
	expiry, err := time.Parse(time.RFC3339, req.Expiry)
	if err != nil {
		expiry = time.Now().Add(time.Hour)
	}
	if err := h.repo.StoreGoogleToken(req.UserId, req.AccessToken, req.RefreshToken, expiry); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &authpb.StoreGoogleTokenResponse{}, nil
}

func (h *AuthHandler) GetGoogleToken(ctx context.Context, req *authpb.GetGoogleTokenRequest) (*authpb.GoogleTokenResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	t, err := h.repo.GetGoogleToken(req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	if t == nil {
		return nil, status.Error(codes.NotFound, "no Google token for user")
	}
	return &authpb.GoogleTokenResponse{
		UserId:       t.UserID,
		AccessToken:  t.AccessToken,
		RefreshToken: t.RefreshToken,
		Expiry:       t.Expiry.Format(time.RFC3339),
	}, nil
}
