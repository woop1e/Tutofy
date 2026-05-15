package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"user-service/internal/model"
	"user-service/internal/repository"

	"github.com/redis/go-redis/v9"
)

var ErrForbidden = errors.New("forbidden")

type UserService interface {
	CreateUser(ctx context.Context, id, email, name, role string) error
	GetUser(ctx context.Context, id string) (*model.User, error)
	UpdateUser(ctx context.Context, callerID, callerRole, targetID, name, email string) (*model.User, error)
	GetAllUsers(ctx context.Context, callerRole string, limit, offset int32) ([]*model.User, error)
	DeleteUser(ctx context.Context, callerRole, targetID string) error
	UpdateTutorProfile(ctx context.Context, callerID, callerRole, tutorID string, in model.TutorProfile) (*model.TutorProfile, error)
	GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error)
	SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error)
	ApproveTutor(ctx context.Context, callerRole, tutorID string) error
	RejectTutor(ctx context.Context, callerRole, tutorID string) error
	GetPendingTutors(ctx context.Context, callerRole string) ([]*model.TutorProfile, error)
}

type userService struct {
	repo repository.UserRepository
	rdb  *redis.Client
}

func NewUserService(repo repository.UserRepository, rdb *redis.Client) UserService {
	return &userService{repo: repo, rdb: rdb}
}

func (s *userService) CreateUser(ctx context.Context, id, email, name, role string) error {
	return s.repo.CreateUser(ctx, id, email, name, role)
}

func (s *userService) GetUser(ctx context.Context, id string) (*model.User, error) {
	if s.rdb != nil {
		if val, err := s.rdb.Get(ctx, "user:"+id).Result(); err == nil {
			var u model.User
			if json.Unmarshal([]byte(val), &u) == nil {
				return &u, nil
			}
		}
	}
	u, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.rdb != nil {
		if data, e := json.Marshal(u); e == nil {
			_ = s.rdb.SetEx(ctx, "user:"+id, string(data), 60*time.Second).Err()
		}
	}
	return u, nil
}

func (s *userService) UpdateUser(ctx context.Context, callerID, callerRole, targetID, name, email string) (*model.User, error) {
	if callerRole != "admin" && callerID != targetID {
		return nil, ErrForbidden
	}
	u, err := s.repo.UpdateUser(ctx, targetID, name, email)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "user:"+targetID).Err()
	}
	return u, err
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
	err := s.repo.DeleteUser(ctx, targetID)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "user:"+targetID).Err()
	}
	return err
}

func (s *userService) UpdateTutorProfile(ctx context.Context, callerID, callerRole, tutorID string, in model.TutorProfile) (*model.TutorProfile, error) {
	if callerRole != "admin" && callerID != tutorID {
		return nil, ErrForbidden
	}
	subjectsJSON, _ := json.Marshal(mustParseStringSlice(in.Subjects))
	certsJSON, _ := json.Marshal(mustParseStringSlice(in.Certificates))
	daysJSON, _ := json.Marshal(mustParseStringSlice(in.AvailableDays))
	in.Subjects = string(subjectsJSON)
	in.Certificates = string(certsJSON)
	in.AvailableDays = string(daysJSON)

	p, err := s.repo.UpdateTutorProfile(ctx, tutorID, in)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "tutor:"+tutorID).Err()
	}
	return p, err
}

func (s *userService) GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error) {
	if s.rdb != nil {
		if val, err := s.rdb.Get(ctx, "tutor:"+tutorID).Result(); err == nil {
			var p model.TutorProfile
			if json.Unmarshal([]byte(val), &p) == nil {
				return &p, nil
			}
		}
	}
	p, err := s.repo.GetTutorProfile(ctx, tutorID)
	if err != nil {
		return nil, err
	}
	if s.rdb != nil {
		if data, e := json.Marshal(p); e == nil {
			_ = s.rdb.SetEx(ctx, "tutor:"+tutorID, string(data), 60*time.Second).Err()
		}
	}
	return p, nil
}

func (s *userService) SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.SearchTutors(ctx, subject, location, minAge, maxAge, limit, offset)
}

func (s *userService) ApproveTutor(ctx context.Context, callerRole, tutorID string) error {
	if callerRole != "admin" {
		return ErrForbidden
	}
	err := s.repo.ApproveTutor(ctx, tutorID)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "tutor:"+tutorID).Err()
	}
	return err
}

func (s *userService) RejectTutor(ctx context.Context, callerRole, tutorID string) error {
	if callerRole != "admin" {
		return ErrForbidden
	}
	err := s.repo.RejectTutor(ctx, tutorID)
	if err == nil && s.rdb != nil {
		_ = s.rdb.Del(ctx, "tutor:"+tutorID).Err()
	}
	return err
}

func (s *userService) GetPendingTutors(ctx context.Context, callerRole string) ([]*model.TutorProfile, error) {
	if callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetPendingTutors(ctx)
}

// mustParseStringSlice parses a JSON string slice or returns the raw value as a slice if it's already parsed.
// Used when the incoming value might be either a JSON string or raw slice marker.
func mustParseStringSlice(raw string) []string {
	if raw == "" || raw == "null" {
		return []string{}
	}
	// Already a JSON array string — try to unmarshal
	var out []string
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		// Treat as a single element
		return []string{raw}
	}
	return out
}
