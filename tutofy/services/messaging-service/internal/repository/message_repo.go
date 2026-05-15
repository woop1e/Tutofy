package repository

import (
	"context"
	"database/sql"
	"errors"

	"messaging-service/internal/model"
)

var ErrNotFound = errors.New("message not found")

type MessageRepository interface {
	CreateMessage(ctx context.Context, m *model.Message) error
	GetConversation(ctx context.Context, userA, userB string, limit, offset int32) ([]*model.Message, error)
	GetUserConversations(ctx context.Context, userID string, limit, offset int32) ([]*model.ConversationItem, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) MessageRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateMessage(ctx context.Context, m *model.Message) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		m.ID, m.SenderID, m.ReceiverID, m.Content, m.IsRead, m.CreatedAt,
	)
	return err
}

func (r *postgresRepo) GetConversation(ctx context.Context, userA, userB string, limit, offset int32) ([]*model.Message, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, sender_id, receiver_id, content, is_read, created_at
		 FROM messages
		 WHERE (sender_id = $1 AND receiver_id = $2)
		    OR (sender_id = $2 AND receiver_id = $1)
		 ORDER BY created_at ASC
		 LIMIT $3 OFFSET $4`,
		userA, userB, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Message
	for rows.Next() {
		m := &model.Message{}
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, m)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetUserConversations(ctx context.Context, userID string, limit, offset int32) ([]*model.ConversationItem, error) {
	rows, err := r.db.QueryContext(ctx,
		`WITH ranked AS (
		   SELECT
		     CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id,
		     content,
		     created_at,
		     ROW_NUMBER() OVER (
		       PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
		       ORDER BY created_at DESC
		     ) AS rn
		   FROM messages
		   WHERE sender_id = $1 OR receiver_id = $1
		 )
		 SELECT other_user_id, content, created_at
		 FROM ranked
		 WHERE rn = 1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.ConversationItem
	for rows.Next() {
		c := &model.ConversationItem{}
		if err := rows.Scan(&c.OtherUserID, &c.LastMessage, &c.LastMessageAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}


