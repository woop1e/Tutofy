package handler

import (
	"context"
	"errors"

	"submission-service/internal/middleware"
	"submission-service/internal/model"
	"submission-service/internal/repository"
	"submission-service/internal/service"
	"submission-service/proto/submissionpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type SubmissionHandler struct {
	submissionpb.UnimplementedSubmissionServiceServer
	svc service.SubmissionService
}

func NewSubmissionHandler(svc service.SubmissionService) *SubmissionHandler {
	return &SubmissionHandler{svc: svc}
}

func (h *SubmissionHandler) SubmitAssignment(ctx context.Context, req *submissionpb.SubmitAssignmentRequest) (*submissionpb.SubmissionResponse, error) {
	if req.GetAssignmentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "assignment_id is required")
	}
	if req.GetContent() == "" && req.GetFileId() == "" {
		return nil, status.Error(codes.InvalidArgument, "content or file_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	s, err := h.svc.SubmitAssignment(ctx, callerID, callerRole, req.GetAssignmentId(), req.GetContent(), req.GetFileId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(s), nil
}

func (h *SubmissionHandler) GetSubmission(ctx context.Context, req *submissionpb.GetSubmissionRequest) (*submissionpb.SubmissionResponse, error) {
	if req.GetAssignmentId() == "" || req.GetStudentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "assignment_id and student_id are required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	s, err := h.svc.GetSubmission(ctx, callerID, callerRole, req.GetAssignmentId(), req.GetStudentId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(s), nil
}

func (h *SubmissionHandler) GetAssignmentSubmissions(ctx context.Context, req *submissionpb.GetAssignmentSubmissionsRequest) (*submissionpb.SubmissionsList, error) {
	if req.GetAssignmentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "assignment_id is required")
	}

	callerRole := middleware.RoleFromContext(ctx)

	submissions, err := h.svc.GetAssignmentSubmissions(ctx, callerRole, req.GetAssignmentId(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, mapError(err)
	}

	list := make([]*submissionpb.SubmissionResponse, 0, len(submissions))
	for _, s := range submissions {
		list = append(list, toProto(s))
	}
	return &submissionpb.SubmissionsList{Submissions: list}, nil
}

func (h *SubmissionHandler) MarkGraded(ctx context.Context, req *submissionpb.MarkGradedRequest) (*submissionpb.SubmissionResponse, error) {
	if req.GetAssignmentId() == "" || req.GetStudentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "assignment_id and student_id are required")
	}

	callerRole := middleware.RoleFromContext(ctx)

	s, err := h.svc.MarkGraded(ctx, callerRole, req.GetAssignmentId(), req.GetStudentId())
	if err != nil {
		return nil, mapError(err)
	}
	return toProto(s), nil
}

func toProto(s *model.Submission) *submissionpb.SubmissionResponse {
	return &submissionpb.SubmissionResponse{
		Id:           s.ID,
		AssignmentId: s.AssignmentID,
		StudentId:    s.StudentID,
		Content:      s.Content,
		FileId:       s.FileID,
		Status:       string(s.Status),
		SubmittedAt:  s.SubmittedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func mapError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotStudent):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotEnrolled):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "submission not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
