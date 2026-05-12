package handler

import (
	"context"
	"net/http"

	"course-service/proto/coursepb"
	"user-service/proto/userpb"
)

// TutorPublicProfileHandler aggregates user profile + published courses + rating
// into a single response for the tutor profile page.
type TutorPublicProfileHandler struct {
	userClient   userpb.UserServiceClient
	courseClient coursepb.CourseServiceClient
}

func NewTutorPublicProfileHandler(u userpb.UserServiceClient, c coursepb.CourseServiceClient) *TutorPublicProfileHandler {
	return &TutorPublicProfileHandler{userClient: u, courseClient: c}
}

type tutorPublicProfile struct {
	Profile *userpb.TutorProfileResponse  `json:"profile"`
	Courses []*coursepb.CourseResponse    `json:"courses"`
}

func (h *TutorPublicProfileHandler) GetTutorPublicProfile(w http.ResponseWriter, r *http.Request) {
	tutorID := r.PathValue("id")
	if tutorID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "tutor id is required"})
		return
	}

	ctx := context.Background() // public endpoint — no auth token required

	// Fetch tutor profile.
	profile, err := h.userClient.GetTutorProfile(ctx, &userpb.GetTutorProfileRequest{TutorId: tutorID})
	if err != nil {
		errResp(w, err)
		return
	}

	// Fetch published courses for this tutor.
	coursesResp, err := h.courseClient.SearchCourses(ctx, &coursepb.SearchCoursesRequest{
		TutorId: tutorID,
		Limit:   50,
	})
	courses := []*coursepb.CourseResponse{}
	if err == nil && coursesResp != nil {
		courses = coursesResp.GetCourses()
	}

	jsonResp(w, http.StatusOK, &tutorPublicProfile{
		Profile: profile,
		Courses: courses,
	})
}

func (h *TutorPublicProfileHandler) SearchTutors(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	resp, err := h.userClient.SearchTutors(tokenCtx(r), &userpb.SearchTutorsRequest{
		Subject:  q.Get("subject"),
		Location: q.Get("location"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *TutorPublicProfileHandler) SearchCourses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	resp, err := h.courseClient.SearchCourses(tokenCtx(r), &coursepb.SearchCoursesRequest{
		TutorId:    q.Get("tutor_id"),
		Tag:        q.Get("tag"),
		CourseType: q.Get("course_type"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
