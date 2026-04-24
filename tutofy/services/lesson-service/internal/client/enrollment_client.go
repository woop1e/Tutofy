package client

import (
	"context"

	"enrollment-service/proto/enrollmentpb"
)

// EnrollmentClient is a thin wrapper around the enrollment-service gRPC client
// so the service layer stays decoupled from the generated proto types.
type EnrollmentClient interface {
	// IsEnrolled returns true if the given user is enrolled in the given course.
	IsEnrolled(ctx context.Context, userID, courseID string) (bool, error)

	// GetEnrolledStudentIDs returns the IDs of all students enrolled in a course.
	GetEnrolledStudentIDs(ctx context.Context, courseID string) ([]string, error)
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

func (c *enrollmentClient) GetEnrolledStudentIDs(ctx context.Context, courseID string) ([]string, error) {
	resp, err := c.grpc.GetCourseEnrollments(ctx, &enrollmentpb.CourseRequest{
		CourseId: courseID,
	})
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(resp.GetEnrollments()))
	for _, e := range resp.GetEnrollments() {
		ids = append(ids, e.GetUserId())
	}
	return ids, nil
}
