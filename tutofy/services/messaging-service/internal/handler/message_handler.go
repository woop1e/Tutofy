package handler

import (
	"context"

	"messaging-service/internal/middleware"
	"messaging-service/internal/model"
	"messaging-service/internal/service"
	"messaging-service/proto/messagingpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type MessagingHandler struct {
	messagingpb.UnimplementedMessagingServiceServer
	svc service.MessageService
}

func NewMessagingHandler(svc service.MessageService) *MessagingHandler {
	return &MessagingHandler{svc: svc}
}

func (h *MessagingHandler) SendMessage(ctx context.Context, req *messagingpb.SendMessageRequest) (*messagingpb.MessageResponse, error) {
	if req.GetReceiverId() == "" {
		return nil, status.Error(codes.InvalidArgument, "receiver_id is required")
	}
	if req.GetContent() == "" {
		return nil, status.Error(codes.InvalidArgument, "content is required")
	}

	senderID := middleware.UserIDFromContext(ctx)
	if senderID == req.GetReceiverId() {
		return nil, status.Error(codes.InvalidArgument, "cannot send a message to yourself")
	}

	m, err := h.svc.SendMessage(ctx, senderID, req.GetReceiverId(), req.GetContent())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return toProto(m), nil
}

func (h *MessagingHandler) GetConversation(ctx context.Context, req *messagingpb.GetConversationRequest) (*messagingpb.MessagesList, error) {
	if req.GetOtherUserId() == "" {
		return nil, status.Error(codes.InvalidArgument, "other_user_id is required")
	}

	callerID := middleware.UserIDFromContext(ctx)
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())

	messages, err := h.svc.GetConversation(ctx, callerID, req.GetOtherUserId(), limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*messagingpb.MessageResponse, 0, len(messages))
	for _, m := range messages {
		list = append(list, toProto(m))
	}
	return &messagingpb.MessagesList{Messages: list}, nil
}

func (h *MessagingHandler) GetUserConversations(ctx context.Context, req *messagingpb.GetUserConversationsRequest) (*messagingpb.ConversationsList, error) {
	callerID := middleware.UserIDFromContext(ctx)
	limit, offset := pageParams(req.GetLimit(), req.GetOffset())

	convs, err := h.svc.GetUserConversations(ctx, callerID, limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	list := make([]*messagingpb.ConversationItem, 0, len(convs))
	for _, c := range convs {
		list = append(list, &messagingpb.ConversationItem{
			OtherUserId:   c.OtherUserID,
			LastMessage:   c.LastMessage,
			LastMessageAt: c.LastMessageAt.UTC().Format("2006-01-02T15:04:05Z"),
		})
	}
	return &messagingpb.ConversationsList{Conversations: list}, nil
}

func toProto(m *model.Message) *messagingpb.MessageResponse {
	return &messagingpb.MessageResponse{
		Id:         m.ID,
		SenderId:   m.SenderID,
		ReceiverId: m.ReceiverID,
		Content:    m.Content,
		IsRead:     m.IsRead,
		CreatedAt:  m.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func pageParams(limit, offset int32) (int32, int32) {
	if limit <= 0 {
		limit = 50
	}
	return limit, offset
}
