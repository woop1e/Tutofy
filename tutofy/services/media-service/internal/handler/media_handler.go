package handler

import (
	"context"
	"errors"

	"media-service/internal/middleware"
	"media-service/internal/model"
	"media-service/internal/repository"
	"media-service/internal/service"
	"media-service/proto/mediapb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// MediaHandler implements mediapb.MediaServiceServer.
type MediaHandler struct {
	mediapb.UnimplementedMediaServiceServer
	svc service.MediaService
}

// NewMediaHandler creates a new MediaHandler.
func NewMediaHandler(svc service.MediaService) *MediaHandler {
	return &MediaHandler{svc: svc}
}

func (h *MediaHandler) UploadFile(ctx context.Context, req *mediapb.UploadFileRequest) (*mediapb.UploadFileResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	fileType := protoFileTypeToModel(req.GetFileType())
	if fileType == model.FileTypeUnspecified {
		return nil, status.Error(codes.InvalidArgument, "file type must be specified")
	}
	if len(req.GetData()) == 0 {
		return nil, status.Error(codes.InvalidArgument, "file data must not be empty")
	}
	if req.GetFileName() == "" {
		return nil, status.Error(codes.InvalidArgument, "file name must not be empty")
	}

	f, err := h.svc.UploadFile(
		ctx,
		callerID, callerRole,
		req.GetCourseId(),
		req.GetFileName(),
		fileType,
		req.GetData(),
	)
	if err != nil {
		return nil, mapError(err)
	}

	return &mediapb.UploadFileResponse{FileId: f.ID}, nil
}

func (h *MediaHandler) GetDownloadURL(ctx context.Context, req *mediapb.GetDownloadURLRequest) (*mediapb.GetDownloadURLResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	url, fileName, err := h.svc.GetDownloadURL(ctx, callerID, callerRole, req.GetFileId())
	if err != nil {
		return nil, mapError(err)
	}

	return &mediapb.GetDownloadURLResponse{Url: url, FileName: fileName}, nil
}

func (h *MediaHandler) DeleteFile(ctx context.Context, req *mediapb.DeleteFileRequest) (*mediapb.DeleteFileResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	if err := h.svc.DeleteFile(ctx, callerID, callerRole, req.GetFileId()); err != nil {
		return nil, mapError(err)
	}

	return &mediapb.DeleteFileResponse{}, nil
}

// --- helpers ---

func protoFileTypeToModel(t mediapb.FileType) model.FileType {
	switch t {
	case mediapb.FileType_FILE_TYPE_ASSIGNMENT:
		return model.FileTypeAssignment
	case mediapb.FileType_FILE_TYPE_COURSE_MATERIAL:
		return model.FileTypeCourseMaterial
	default:
		return model.FileTypeUnspecified
	}
}

func mapError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotEnrolled):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "file not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
