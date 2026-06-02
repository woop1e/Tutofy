package handler

import (
	"context"
	"net/http"

	"auth-service/proto/authpb"
	"notification-service/proto/notificationpb"
	"user-service/proto/userpb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UserHandler struct {
	client      userpb.UserServiceClient
	auth        authpb.AuthServiceClient
	notifClient notificationpb.NotificationServiceClient
}

func NewUserHandler(c userpb.UserServiceClient, auth authpb.AuthServiceClient, nc notificationpb.NotificationServiceClient) *UserHandler {
	return &UserHandler{client: c, auth: auth, notifClient: nc}
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetUser(tokenCtx(r), &userpb.GetUserRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var req userpb.UpdateUserRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.UserId = r.PathValue("id")
	resp, err := h.client.UpdateUser(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var req userpb.GetAllUsersRequest
	_ = decode(r, &req)
	resp, err := h.client.GetAllUsers(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	_, err := h.client.DeleteUser(tokenCtx(r), &userpb.DeleteUserRequest{UserId: id})
	if err != nil {
		errResp(w, err)
		return
	}
	// Also delete from auth-service so the user can no longer log in.
	_, _ = h.auth.DeleteUser(tokenCtx(r), &authpb.DeleteUserRequest{UserId: id})
	w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) UpdateTutorProfile(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Bio                string   `json:"bio"`
		Age                int32    `json:"age"`
		Location           string   `json:"location"`
		PhotoURL           string   `json:"photo_url"`
		Subjects           []string `json:"subjects"`
		ExperienceYears    int32    `json:"experience_years"`
		Certificates       []string `json:"certificates"`
		Phone              string   `json:"phone"`
		TeachingLanguage   string   `json:"teaching_language"`
		StudentLevel       string   `json:"student_level"`
		LessonType         string   `json:"lesson_type"`
		HourlyPrice        int32    `json:"hourly_price"`
		Education          string   `json:"education"`
		AvailableDays      []string `json:"available_days"`
		AvailableTimeStart string   `json:"available_time_start"`
		AvailableTimeEnd   string   `json:"available_time_end"`
		Timezone           string   `json:"timezone"`
	}
	if err := decode(r, &body); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	uid := r.PathValue("id")
	req := &userpb.UpdateTutorProfileRequest{
		UserId:             uid,
		Bio:                body.Bio,
		Age:                body.Age,
		Location:           body.Location,
		PhotoUrl:           body.PhotoURL,
		Subjects:           body.Subjects,
		ExperienceYears:    body.ExperienceYears,
		Certificates:       body.Certificates,
		Phone:              body.Phone,
		TeachingLanguage:   body.TeachingLanguage,
		StudentLevel:       body.StudentLevel,
		LessonType:         body.LessonType,
		HourlyPrice:        body.HourlyPrice,
		Education:          body.Education,
		AvailableDays:      body.AvailableDays,
		AvailableTimeStart: body.AvailableTimeStart,
		AvailableTimeEnd:   body.AvailableTimeEnd,
		Timezone:           body.Timezone,
	}
	resp, err := h.client.UpdateTutorProfile(tokenCtx(r), req)
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			// User exists in auth-service but not in user-service — auto-create the record and retry.
			if info, infoErr := h.auth.GetUserInfo(r.Context(), &authpb.GetUserInfoRequest{UserId: uid}); infoErr == nil {
				_, _ = h.client.CreateUser(tokenCtx(r), &userpb.CreateUserRequest{
					Id:    info.GetUserId(),
					Email: info.GetEmail(),
					Name:  info.GetName(),
					Role:  info.GetRole(),
				})
				resp, err = h.client.UpdateTutorProfile(tokenCtx(r), req)
			}
		}
		if err != nil {
			errResp(w, err)
			return
		}
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) GetTutorProfile(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetTutorProfile(tokenCtx(r), &userpb.GetTutorProfileRequest{TutorId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) ApproveTutor(w http.ResponseWriter, r *http.Request) {
	tutorID := r.PathValue("id")
	_, err := h.client.ApproveTutor(tokenCtx(r), &userpb.ApproveTutorRequest{TutorId: tutorID})
	if err != nil {
		errResp(w, err)
		return
	}
	if h.notifClient != nil {
		go func() {
			_, _ = h.notifClient.NotifyUser(context.Background(), &notificationpb.NotifyUserRequest{
				UserId:  tutorID,
				Type:    13, // NOTIFICATION_TYPE_TUTOR_APPROVED
				Message: "Congratulations! Your tutor profile has been approved. You can now receive bookings from students.",
			})
		}()
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "approved"})
}

func (h *UserHandler) RejectTutor(w http.ResponseWriter, r *http.Request) {
	tutorID := r.PathValue("id")
	_, err := h.client.RejectTutor(tokenCtx(r), &userpb.RejectTutorRequest{TutorId: tutorID})
	if err != nil {
		errResp(w, err)
		return
	}
	if h.notifClient != nil {
		go func() {
			_, _ = h.notifClient.NotifyUser(context.Background(), &notificationpb.NotifyUserRequest{
				UserId:  tutorID,
				Type:    14, // NOTIFICATION_TYPE_TUTOR_REJECTED
				Message: "Your tutor profile application was not approved at this time. Please review your profile information and resubmit for review.",
			})
		}()
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "rejected"})
}

func (h *UserHandler) GetPendingTutors(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetPendingTutors(tokenCtx(r), &userpb.Empty{})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *UserHandler) GetAllTutors(w http.ResponseWriter, r *http.Request) {
	statusFilter := r.URL.Query().Get("status")
	resp, err := h.client.GetTutorsByStatus(tokenCtx(r), &userpb.GetTutorsByStatusRequest{Status: statusFilter})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
