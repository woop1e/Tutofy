package client

import (
	"context"

	"enrollment-service/proto/enrollmentpb"
	"google.golang.org/grpc/metadata"
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
	md, _ := metadata.FromIncomingContext(ctx)
	outCtx := metadata.NewOutgoingContext(ctx, md)
	resp, err := c.grpc.GetUserEnrollments(outCtx, &enrollmentpb.UserRequest{
		UserId: userID,
	})
	if err != nil {
		return false, err
	}
	for _, e := range resp.GetEnrollments() {
		if e.GetCourseId() == courseID {
			return true, nil
		}
	}
	return false, nil
}
