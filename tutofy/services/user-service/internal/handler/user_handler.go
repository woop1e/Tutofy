package handler

import (
	"context"
	"errors"

	"user-service/internal/middleware"
	"user-service/internal/model"
	"user-service/internal/repository"
	"user-service/internal/service"
	"user-service/proto/userpb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UserHandler struct {
	userpb.UnimplementedUserServiceServer
	svc service.UserService
}

func NewUserHandler(svc service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) GetUser(ctx context.Context, req *userpb.GetUserRequest) (*userpb.UserResponse, error) {
	user, err := h.svc.GetUser(ctx, req.GetUserId())
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(user), nil
}

func (h *UserHandler) UpdateUser(ctx context.Context, req *userpb.UpdateUserRequest) (*userpb.UserResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	user, err := h.svc.UpdateUser(ctx, callerID, callerRole, req.GetUserId(), req.GetName(), req.GetEmail())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(user), nil
}

func (h *UserHandler) GetAllUsers(ctx context.Context, _ *userpb.Empty) (*userpb.UsersList, error) {
	callerRole := middleware.RoleFromContext(ctx)

	users, err := h.svc.GetAllUsers(ctx, callerRole)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*userpb.UserResponse, 0, len(users))
	for _, u := range users {
		list = append(list, toProto(u))
	}
	return &userpb.UsersList{Users: list}, nil
}

func toProto(u *model.User) *userpb.UserResponse {
	return &userpb.UserResponse{
		Id:    u.ID,
		Email: u.Email,
		Name:  u.Name,
		Role:  u.Role,
	}
}
