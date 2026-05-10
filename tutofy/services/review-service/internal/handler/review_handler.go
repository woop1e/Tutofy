package handler

import (
	"context"
	"errors"

	"review-service/internal/middleware"
	"review-service/internal/model"
	"review-service/internal/service"
	"review-service/proto/reviewpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ReviewHandler struct {
	reviewpb.UnimplementedReviewServiceServer
	svc service.ReviewService
}

func NewReviewHandler(svc service.ReviewService) *ReviewHandler { return &ReviewHandler{svc: svc} }

func (h *ReviewHandler) CreateReview(ctx context.Context, req *reviewpb.CreateReviewRequest) (*reviewpb.ReviewResponse, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	if req.GetRating() < 1 || req.GetRating() > 5 {
		return nil, status.Error(codes.InvalidArgument, "rating must be between 1 and 5")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	rv, err := h.svc.CreateReview(ctx, callerID, callerRole, req.GetCourseId(), req.GetRating(), req.GetBody())
	if err != nil {
		return nil, mapErr(err)
	}
	return toProto(rv), nil
}

func (h *ReviewHandler) GetCourseReviews(ctx context.Context, req *reviewpb.GetCourseReviewsRequest) (*reviewpb.ReviewsList, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	reviews, err := h.svc.GetCourseReviews(ctx, req.GetCourseId(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	list := make([]*reviewpb.ReviewResponse, 0, len(reviews))
	for _, r := range reviews {
		list = append(list, toProto(r))
	}
	return &reviewpb.ReviewsList{Reviews: list}, nil
}

func (h *ReviewHandler) GetCourseRating(ctx context.Context, req *reviewpb.GetCourseRatingRequest) (*reviewpb.RatingResponse, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	cr, err := h.svc.GetCourseRating(ctx, req.GetCourseId())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &reviewpb.RatingResponse{Average: cr.Average, Count: cr.Count}, nil
}

func toProto(r *model.Review) *reviewpb.ReviewResponse {
	return &reviewpb.ReviewResponse{
		Id:        r.ID,
		CourseId:  r.CourseID,
		StudentId: r.StudentID,
		Rating:    r.Rating,
		Body:      r.Body,
		CreatedAt: r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotStudent):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotEnrolled), errors.Is(err, service.ErrCourseNotComplete):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, service.ErrAlreadyReviewed):
		return status.Error(codes.AlreadyExists, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
