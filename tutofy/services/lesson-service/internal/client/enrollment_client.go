package client

import (
	"context"

	"enrollment-service/proto/enrollmentpb"
	"google.golang.org/grpc/metadata"
)

// EnrollmentClient is a thin wrapper around the enrollment-service gRPC client
// so the service layer stays decoupled from the generated proto types.
type EnrollmentClient interface {
	// IsEnrolled returns true if the given user is enrolled in the given course.
	IsEnrolled(ctx context.Context, userID, courseID string) (bool, error)

	// GetEnrolledCourseIDs returns all course IDs a student is enrolled in.
	GetEnrolledCourseIDs(ctx context.Context, userID string) ([]string, error)

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

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (c *enrollmentClient) IsEnrolled(ctx context.Context, userID, courseID string) (bool, error) {
	resp, err := c.grpc.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: userID})
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

func (c *enrollmentClient) GetEnrolledStudentIDs(ctx context.Context, courseID string) ([]string, error) {
	resp, err := c.grpc.GetCourseEnrollments(outCtx(ctx), &enrollmentpb.CourseRequest{
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

func (c *enrollmentClient) GetEnrolledCourseIDs(ctx context.Context, userID string) ([]string, error) {
	resp, err := c.grpc.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: userID})
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(resp.GetEnrollments()))
	for _, e := range resp.GetEnrollments() {
		ids = append(ids, e.GetCourseId())
	}
	return ids, nil
}
