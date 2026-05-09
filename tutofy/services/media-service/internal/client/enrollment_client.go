package client

import (
	"context"

	"enrollment-service/proto/enrollmentpb"
)

// EnrollmentClient checks whether a user is enrolled in a course.
type EnrollmentClient interface {
	IsEnrolled(ctx context.Context, userID, courseID string) (bool, error)
}

type enrollmentClient struct {
	grpc enrollmentpb.EnrollmentServiceClient
}

// NewEnrollmentClient creates an EnrollmentClient backed by the gRPC stub.
func NewEnrollmentClient(grpc enrollmentpb.EnrollmentServiceClient) EnrollmentClient {
	return &enrollmentClient{grpc: grpc}
}

func (c *enrollmentClient) IsEnrolled(ctx context.Context, userID, courseID string) (bool, error) {
	resp, err := c.grpc.GetCourseEnrollments(ctx, &enrollmentpb.CourseRequest{
		CourseId: courseID,
	})
	if err != nil {
		return false, err
	}
	for _, e := range resp.GetEnrollments() {
		if e.GetUserId() == userID {
			return true, nil
		}
	}
	return false, nil
}
