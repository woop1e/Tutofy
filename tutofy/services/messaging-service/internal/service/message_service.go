package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"messaging-service/internal/model"
	"messaging-service/internal/repository"
	"notification-service/proto/notificationpb"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

// detachedCtx returns a background context that carries the incoming auth metadata
// from ctx but is not tied to the request lifetime.
func detachedCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(context.Background(), md)
}

var ErrForbidden = errors.New("forbidden")

type MessageService interface {
	SendMessage(ctx context.Context, senderID, receiverID, content string) (*model.Message, error)
	GetConversation(ctx context.Context, callerID, otherUserID string, limit, offset int32) ([]*model.Message, error)
	GetUserConversations(ctx context.Context, callerID string, limit, offset int32) ([]*model.ConversationItem, error)
}

type messageService struct {
	repo               repository.MessageRepository
	notificationClient notificationpb.NotificationServiceClient
}

func NewMessageService(repo repository.MessageRepository, notificationClient notificationpb.NotificationServiceClient) MessageService {
	return &messageService{repo: repo, notificationClient: notificationClient}
}

func (s *messageService) SendMessage(ctx context.Context, senderID, receiverID, content string) (*model.Message, error) {
	m := &model.Message{
		ID:         uuid.NewString(),
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		IsRead:     false,
		CreatedAt:  time.Now(),
	}
	if err := s.repo.CreateMessage(ctx, m); err != nil {
		return nil, err
	}

	// Notify receiver of new message.
	if s.notificationClient != nil {
		notifCtx := detachedCtx(ctx)
		go s.notificationClient.NotifyUser(notifCtx, &notificationpb.NotifyUserRequest{
			UserId:  receiverID,
			Type:    4, // NOTIFICATION_TYPE_NEW_MESSAGE
			Message: fmt.Sprintf("New message: %.80s", content),
		})
	}

	return m, nil
}

func (s *messageService) GetConversation(ctx context.Context, callerID, otherUserID string, limit, offset int32) ([]*model.Message, error) {
	return s.repo.GetConversation(ctx, callerID, otherUserID, limit, offset)
}

func (s *messageService) GetUserConversations(ctx context.Context, callerID string, limit, offset int32) ([]*model.ConversationItem, error) {
	return s.repo.GetUserConversations(ctx, callerID, limit, offset)
}


