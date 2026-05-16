package handler

import (
	"net/http"

	"review-service/proto/reviewpb"
)

type ReviewHandler struct {
	client reviewpb.ReviewServiceClient
}

func NewReviewHandler(c reviewpb.ReviewServiceClient) *ReviewHandler {
	return &ReviewHandler{client: c}
}

func (h *ReviewHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	var req reviewpb.CreateReviewRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreateReview(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *ReviewHandler) GetCourseReviews(w http.ResponseWriter, r *http.Request) {
	courseID := r.PathValue("id")
	limit  := parseInt32(r.URL.Query().Get("limit"))
	offset := parseInt32(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 20
	}
	resp, err := h.client.GetCourseReviews(tokenCtx(r), &reviewpb.GetCourseReviewsRequest{
		CourseId: courseID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *ReviewHandler) GetCourseRating(w http.ResponseWriter, r *http.Request) {
	courseID := r.PathValue("id")
	resp, err := h.client.GetCourseRating(tokenCtx(r), &reviewpb.GetCourseRatingRequest{
		CourseId: courseID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
