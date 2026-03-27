package handler

import (
	"auth-service/internal/service"
	"auth-service/proto/authpb"
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthHandler struct {
	authpb.UnimplementedAuthServiceServer
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(ctx context.Context, req *authpb.RegisterRequest) (*authpb.AuthResponse, error) {
	if req.Email == "" || req.Password == "" || req.Role == "" {
		return nil, status.Error(codes.InvalidArgument, "email, password, and role are required")
	}

	token, err := h.svc.Register(req.Email, req.Password, req.Name, req.Role)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &authpb.AuthResponse{Token: token, Message: "registered successfully"}, nil
}

func (h *AuthHandler) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.AuthResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password are required")
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
