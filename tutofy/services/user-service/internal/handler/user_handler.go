package handler

import (
	"context"
	"errors"
	"regexp"

	"user-service/internal/middleware"
	"user-service/internal/model"
	"user-service/internal/repository"
	"user-service/internal/service"
	"user-service/proto/userpb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var emailRE = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

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
	if req.GetName() == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.GetEmail() == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if !emailRE.MatchString(req.GetEmail()) {
		return nil, status.Error(codes.InvalidArgument, "invalid email format")
	}

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

func (h *UserHandler) GetAllUsers(ctx context.Context, req *userpb.GetAllUsersRequest) (*userpb.UsersList, error) {
	callerRole := middleware.RoleFromContext(ctx)
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())

	users, err := h.svc.GetAllUsers(ctx, callerRole, limit, offset)
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

func (h *UserHandler) DeleteUser(ctx context.Context, req *userpb.DeleteUserRequest) (*userpb.Empty, error) {
	callerRole := middleware.RoleFromContext(ctx)

	err := h.svc.DeleteUser(ctx, callerRole, req.GetUserId())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &userpb.Empty{}, nil
}

func pageParams(limit, offset int32) (int32, int32) {
	if limit <= 0 {
		limit = 50
	}
	return limit, offset
}

func toProto(u *model.User) *userpb.UserResponse {
	return &userpb.UserResponse{
		Id:    u.ID,
		Email: u.Email,
		Name:  u.Name,
		Role:  u.Role,
	}
}
