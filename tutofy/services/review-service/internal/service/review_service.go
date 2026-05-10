package service

import (
	"context"
	"errors"
	"time"

	"enrollment-service/proto/enrollmentpb"
	"progress-service/proto/progresspb"
	"review-service/internal/model"
	"review-service/internal/repository"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

var (
	ErrForbidden         = errors.New("forbidden")
	ErrNotStudent        = errors.New("only students can leave reviews")
	ErrNotEnrolled       = errors.New("must be enrolled to review this course")
	ErrCourseNotComplete = errors.New("must complete the course before reviewing")
	ErrAlreadyReviewed   = errors.New("already reviewed this course")
)

type ReviewService interface {
	CreateReview(ctx context.Context, callerID, callerRole, courseID string, rating int32, body string) (*model.Review, error)
	GetCourseReviews(ctx context.Context, courseID string, limit, offset int32) ([]*model.Review, error)
	GetCourseRating(ctx context.Context, courseID string) (*model.CourseRating, error)
}

type reviewService struct {
	repo             repository.ReviewRepository
	progressClient   progresspb.ProgressServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
}

func NewReviewService(
	repo repository.ReviewRepository,
	progressClient progresspb.ProgressServiceClient,
	enrollmentClient enrollmentpb.EnrollmentServiceClient,
) ReviewService {
	return &reviewService{repo: repo, progressClient: progressClient, enrollmentClient: enrollmentClient}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *reviewService) CreateReview(ctx context.Context, callerID, callerRole, courseID string, rating int32, body string) (*model.Review, error) {
	if callerRole != "student" {
		return nil, ErrNotStudent
	}

	// Verify enrollment.
	enrollments, err := s.enrollmentClient.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: callerID})
	if err != nil {
		return nil, errors.New("enrollment service unavailable")
	}
	enrolled := false
	for _, e := range enrollments.GetEnrollments() {
		if e.GetCourseId() == courseID {
			enrolled = true
			break
		}
	}
	if !enrolled {
		return nil, ErrNotEnrolled
	}

	// Verify 100% completion.
	progress, err := s.progressClient.GetProgress(outCtx(ctx), &progresspb.GetProgressRequest{
		StudentId: callerID,
		CourseId:  courseID,
	})
	if err != nil || progress.GetCompletionPct() < 100 {
		return nil, ErrCourseNotComplete
	}

	rv := &model.Review{
		ID:        uuid.NewString(),
		CourseID:  courseID,
		StudentID: callerID,
		Rating:    rating,
		Body:      body,
		CreatedAt: time.Now(),
	}
	if err := s.repo.Create(ctx, rv); err != nil {
		if errors.Is(err, repository.ErrAlreadyExists) {
			return nil, ErrAlreadyReviewed
		}
		return nil, err
	}
	return rv, nil
}

func (s *reviewService) GetCourseReviews(ctx context.Context, courseID string, limit, offset int32) ([]*model.Review, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.GetByCourse(ctx, courseID, limit, offset)
}

func (s *reviewService) GetCourseRating(ctx context.Context, courseID string) (*model.CourseRating, error) {
	return s.repo.GetRating(ctx, courseID)
}
