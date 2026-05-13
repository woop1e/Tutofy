package handler

import (
	"context"
	"errors"

	"notification-service/internal/middleware"
	"notification-service/internal/repository"
	"notification-service/internal/service"
	"notification-service/proto/notificationpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"notification-service/internal/model"
)

// NotificationHandler implements notificationpb.NotificationServiceServer.
type NotificationHandler struct {
	notificationpb.UnimplementedNotificationServiceServer
	svc service.NotificationService
}

// NewNotificationHandler creates a new NotificationHandler.
func NewNotificationHandler(svc service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

// NotifyGrade is called by grading-service when a grade is submitted.
func (h *NotificationHandler) NotifyGrade(ctx context.Context, req *notificationpb.NotifyGradeRequest) (*notificationpb.NotifyGradeResponse, error) {
	err := h.svc.NotifyGrade(ctx, req.GetAssignmentId(), req.GetStudentId(), req.GetGrade())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &notificationpb.NotifyGradeResponse{}, nil
}

// GetNotifications returns notifications for a user.
func (h *NotificationHandler) GetNotifications(ctx context.Context, req *notificationpb.GetNotificationsRequest) (*notificationpb.NotificationsList, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	callerRole := middleware.RoleFromContext(ctx)

	notifications, err := h.svc.GetNotifications(ctx, callerID, callerRole, req.GetUserId(), req.GetUnreadOnly(), 50, 0)
	if err != nil {
		return nil, mapError(err)
	}

	list := make([]*notificationpb.Notification, 0, len(notifications))
	for _, n := range notifications {
		list = append(list, toProto(n))
	}
	return &notificationpb.NotificationsList{Notifications: list}, nil
}

// MarkAsRead marks a notification as read for the calling user.
func (h *NotificationHandler) MarkAsRead(ctx context.Context, req *notificationpb.MarkReadRequest) (*notificationpb.MarkReadResponse, error) {
	callerID := middleware.UserIDFromContext(ctx)

	err := h.svc.MarkAsRead(ctx, callerID, req.GetNotificationId())
	if err != nil {
		return nil, mapError(err)
	}
	return &notificationpb.MarkReadResponse{}, nil
}

// --- helpers ---

func toProto(n *model.Notification) *notificationpb.Notification {
	return &notificationpb.Notification{
		Id:        n.ID,
		UserId:    n.UserID,
		Type:      notificationpb.NotificationType(n.Type),
		Message:   n.Message,
		IsRead:    n.IsRead,
		CreatedAt: timestamppb.New(n.CreatedAt),
	}
}

func mapError(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden):
		return status.Error(codes.PermissionDenied, "forbidden")
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "notification not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}

// NotifyUser is called by any internal service to notify a user.
func (h *NotificationHandler) NotifyUser(ctx context.Context, req *notificationpb.NotifyUserRequest) (*notificationpb.NotifyGradeResponse, error) {
	if req.GetUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if err := h.svc.NotifyUser(ctx, req.GetUserId(), req.GetType(), req.GetMessage()); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &notificationpb.NotifyGradeResponse{}, nil
}
