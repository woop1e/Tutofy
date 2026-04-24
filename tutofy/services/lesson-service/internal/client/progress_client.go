package client

import (
	"context"
	"log"

	"lesson-service/internal/model"
	"progress-service/proto/progresspb"
)

// ProgressClient is a thin wrapper around the progress-service gRPC client.
type ProgressClient interface {
	// RecordLessonEvent notifies progress-service of a lesson status change
	// for each of the provided student IDs.
	RecordLessonEvent(ctx context.Context, studentIDs []string, courseID, lessonID string, status model.LessonStatus)
}

type progressClient struct {
	grpc progresspb.ProgressServiceClient
}

// NewProgressClient creates a ProgressClient backed by the gRPC stub.
func NewProgressClient(grpc progresspb.ProgressServiceClient) ProgressClient {
	return &progressClient{grpc: grpc}
}

func (c *progressClient) RecordLessonEvent(
	ctx context.Context,
	studentIDs []string,
	courseID, lessonID string,
	status model.LessonStatus,
) {
	protoStatus := modelStatusToProto(status)
	for _, studentID := range studentIDs {
		_, err := c.grpc.RecordLessonEvent(ctx, &progresspb.RecordLessonEventRequest{
			StudentId: studentID,
			CourseId:  courseID,
			LessonId:  lessonID,
			Status:    protoStatus,
		})
		if err != nil {
			// Progress sync failure is non-fatal — log and continue.
			// A background reconciliation job can fix drift later.
			log.Printf("warn: failed to record lesson event for student %s: %v", studentID, err)
		}
	}
}

func modelStatusToProto(s model.LessonStatus) progresspb.LessonStatus {
	switch s {
	case model.LessonStatusPlanned:
		return progresspb.LessonStatus_LESSON_STATUS_PLANNED
	case model.LessonStatusCompleted:
		return progresspb.LessonStatus_LESSON_STATUS_COMPLETED
	case model.LessonStatusCancelled:
		return progresspb.LessonStatus_LESSON_STATUS_CANCELLED
	default:
		return progresspb.LessonStatus_LESSON_STATUS_UNSPECIFIED
	}
}
