package service

import (
	"context"
	"errors"

	"user-service/internal/model"
	"user-service/internal/repository"
)

var ErrForbidden = errors.New("forbidden")

type UserService interface {
	GetUser(ctx context.Context, id string) (*model.User, error)
	UpdateUser(ctx context.Context, callerID, callerRole, targetID, name, email string) (*model.User, error)
	GetAllUsers(ctx context.Context, callerRole string, limit, offset int32) ([]*model.User, error)
	DeleteUser(ctx context.Context, callerRole, targetID string) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetUser(ctx context.Context, id string) (*model.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userService) UpdateUser(ctx context.Context, callerID, callerRole, targetID, name, email string) (*model.User, error) {
	if callerRole != "admin" && callerID != targetID {
		return nil, ErrForbidden
	}
	return s.repo.UpdateUser(ctx, targetID, name, email)
}

func (s *userService) GetAllUsers(ctx context.Context, callerRole string, limit, offset int32) ([]*model.User, error) {
	if callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetAllUsers(ctx, limit, offset)
}

func (s *userService) DeleteUser(ctx context.Context, callerRole, targetID string) error {
	if callerRole != "admin" {
		return ErrForbidden
	}
	return s.repo.DeleteUser(ctx, targetID)
}
