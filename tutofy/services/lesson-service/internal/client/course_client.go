package client

import (
	"context"
	"errors"

	"course-service/proto/coursepb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CourseClient verifies that a course exists before a lesson is created.
type CourseClient interface {
	CourseExists(ctx context.Context, courseID string) error
}

type courseClient struct {
	grpc coursepb.CourseServiceClient
}

func NewCourseClient(grpc coursepb.CourseServiceClient) CourseClient {
	return &courseClient{grpc: grpc}
}

func (c *courseClient) CourseExists(ctx context.Context, courseID string) error {
	_, err := c.grpc.GetCourse(outCtx(ctx), &coursepb.GetCourseRequest{CourseId: courseID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			return errors.New("course not found")
		}
		return errors.New("course service unavailable")
	}
	return nil
}
