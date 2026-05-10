package model

import "time"

type Message struct {
	ID         string
	SenderID   string
	ReceiverID string
	Content    string
	IsRead     bool
	CreatedAt  time.Time
}

type ConversationItem struct {
	OtherUserID   string
	LastMessage   string
	LastMessageAt time.Time
}
