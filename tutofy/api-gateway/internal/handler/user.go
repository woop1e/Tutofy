package handler

import (
	"net/http"

	"user-service/proto/userpb"
)

type UserHandler struct{ client userpb.UserServiceClient }

func NewUserHandler(c userpb.UserServiceClient) *UserHandler { return &UserHandler{c} }

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
	_, err := h.client.DeleteUser(tokenCtx(r), &userpb.DeleteUserRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
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
	resp, err := h.client.UpdateTutorProfile(tokenCtx(r), &userpb.UpdateTutorProfileRequest{
		UserId:             r.PathValue("id"),
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
	})
	if err != nil {
		errResp(w, err)
		return
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
	_, err := h.client.ApproveTutor(tokenCtx(r), &userpb.ApproveTutorRequest{TutorId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "approved"})
}

func (h *UserHandler) RejectTutor(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.RejectTutor(tokenCtx(r), &userpb.RejectTutorRequest{TutorId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
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
