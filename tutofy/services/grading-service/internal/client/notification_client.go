package client

import (
	"context"
	"log"

	"notification-service/proto/notificationpb"
)

// NotificationClient is a thin wrapper around the notification-service gRPC client.
type NotificationClient interface {
	// NotifyGrade fires a grade notification for the student. Non-blocking — logs on failure.
	NotifyGrade(ctx context.Context, assignmentID, studentID string, grade float32)
}

type notificationClient struct {
	grpc notificationpb.NotificationServiceClient
}

// NewNotificationClient creates a NotificationClient backed by the gRPC stub.
func NewNotificationClient(grpc notificationpb.NotificationServiceClient) NotificationClient {
	return &notificationClient{grpc: grpc}
}

func (c *notificationClient) NotifyGrade(ctx context.Context, assignmentID, studentID string, grade float32) {
	_, err := c.grpc.NotifyGrade(ctx, &notificationpb.NotifyGradeRequest{
		AssignmentId: assignmentID,
		StudentId:    studentID,
		Grade:        grade,
	})
	if err != nil {
		// Non-fatal: grading already succeeded, notification failure is logged only.
		log.Printf("warn: failed to send grade notification for student %s: %v", studentID, err)
	}
}

// go s.notification.NotifyGrade(ctx, assignmentID, studentID, grade) write to handler after submitting grade
