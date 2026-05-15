package handler

import (
	"context"
	"encoding/json"
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

func (h *UserHandler) CreateUser(ctx context.Context, req *userpb.CreateUserRequest) (*userpb.UserResponse, error) {
	if req.GetId() == "" || req.GetEmail() == "" || req.GetName() == "" {
		return nil, status.Error(codes.InvalidArgument, "id, email, and name are required")
	}
	if err := h.svc.CreateUser(ctx, req.GetId(), req.GetEmail(), req.GetName(), req.GetRole()); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &userpb.UserResponse{Id: req.GetId(), Email: req.GetEmail(), Name: req.GetName(), Role: req.GetRole()}, nil
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

func (h *UserHandler) UpdateTutorProfile(ctx context.Context, req *userpb.UpdateTutorProfileRequest) (*userpb.TutorProfileResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	subjectsJSON, _ := json.Marshal(req.GetSubjects())
	certsJSON, _ := json.Marshal(req.GetCertificates())
	daysJSON, _ := json.Marshal(req.GetAvailableDays())

	in := model.TutorProfile{
		Bio:                req.GetBio(),
		Age:                req.GetAge(),
		Location:           req.GetLocation(),
		PhotoURL:           req.GetPhotoUrl(),
		Subjects:           string(subjectsJSON),
		ExperienceYears:    req.GetExperienceYears(),
		Certificates:       string(certsJSON),
		Phone:              req.GetPhone(),
		TeachingLanguage:   req.GetTeachingLanguage(),
		StudentLevel:       req.GetStudentLevel(),
		LessonType:         req.GetLessonType(),
		HourlyPrice:        req.GetHourlyPrice(),
		Education:          req.GetEducation(),
		AvailableDays:      string(daysJSON),
		AvailableTimeStart: req.GetAvailableTimeStart(),
		AvailableTimeEnd:   req.GetAvailableTimeEnd(),
		Timezone:           req.GetTimezone(),
	}

	p, err := h.svc.UpdateTutorProfile(ctx, callerID, callerRole, req.GetUserId(), in)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "tutor not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toTutorProto(p), nil
}

func (h *UserHandler) GetTutorProfile(ctx context.Context, req *userpb.GetTutorProfileRequest) (*userpb.TutorProfileResponse, error) {
	if req.GetTutorId() == "" {
		return nil, status.Error(codes.InvalidArgument, "tutor_id is required")
	}
	p, err := h.svc.GetTutorProfile(ctx, req.GetTutorId())
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "tutor not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toTutorProto(p), nil
}

func toTutorProto(p *model.TutorProfile) *userpb.TutorProfileResponse {
	return &userpb.TutorProfileResponse{
		Id:                 p.ID,
		Name:               p.Name,
		Email:              p.Email,
		Bio:                p.Bio,
		Age:                p.Age,
		Location:           p.Location,
		PhotoUrl:           p.PhotoURL,
		Subjects:           parseJSONStrings(p.Subjects),
		ExperienceYears:    p.ExperienceYears,
		Certificates:       parseJSONStrings(p.Certificates),
		Status:             p.Status,
		Phone:              p.Phone,
		TeachingLanguage:   p.TeachingLanguage,
		StudentLevel:       p.StudentLevel,
		LessonType:         p.LessonType,
		HourlyPrice:        p.HourlyPrice,
		Education:          p.Education,
		AvailableDays:      parseJSONStrings(p.AvailableDays),
		AvailableTimeStart: p.AvailableTimeStart,
		AvailableTimeEnd:   p.AvailableTimeEnd,
		Timezone:           p.Timezone,
	}
}

func parseJSONStrings(raw string) []string {
	if raw == "" || raw == "[]" || raw == "null" {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return []string{}
	}
	return out
}

func (h *UserHandler) SearchTutors(ctx context.Context, req *userpb.SearchTutorsRequest) (*userpb.TutorCardsList, error) {
	tutors, err := h.svc.SearchTutors(ctx, req.GetSubject(), req.GetLocation(), req.GetMinAge(), req.GetMaxAge(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	list := make([]*userpb.TutorProfileResponse, 0, len(tutors))
	for _, p := range tutors {
		list = append(list, toTutorProto(p))
	}
	return &userpb.TutorCardsList{Tutors: list}, nil
}

func (h *UserHandler) ApproveTutor(ctx context.Context, req *userpb.ApproveTutorRequest) (*userpb.Empty, error) {
	callerRole := middleware.RoleFromContext(ctx)
	if err := h.svc.ApproveTutor(ctx, callerRole, req.GetTutorId()); err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "tutor not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &userpb.Empty{}, nil
}

func (h *UserHandler) RejectTutor(ctx context.Context, req *userpb.RejectTutorRequest) (*userpb.Empty, error) {
	callerRole := middleware.RoleFromContext(ctx)
	if err := h.svc.RejectTutor(ctx, callerRole, req.GetTutorId()); err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		if errors.Is(err, repository.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "tutor not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &userpb.Empty{}, nil
}

func (h *UserHandler) GetPendingTutors(ctx context.Context, _ *userpb.Empty) (*userpb.PendingTutorsList, error) {
	callerRole := middleware.RoleFromContext(ctx)
	tutors, err := h.svc.GetPendingTutors(ctx, callerRole)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	list := make([]*userpb.TutorProfileResponse, 0, len(tutors))
	for _, p := range tutors {
		list = append(list, toTutorProto(p))
	}
	return &userpb.PendingTutorsList{Tutors: list}, nil
}
