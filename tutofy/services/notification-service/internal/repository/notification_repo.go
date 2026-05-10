package repository

import (
	"context"
	"database/sql"
	"errors"

	"notification-service/internal/model"
)

var ErrNotFound = errors.New("notification not found")

// NotificationRepository is the data-access contract.
type NotificationRepository interface {
	CreateNotification(ctx context.Context, n *model.Notification) error
	GetNotifications(ctx context.Context, userID string, unreadOnly bool, limit, offset int32) ([]*model.Notification, error)
	MarkAsRead(ctx context.Context, notificationID, userID string) error
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) NotificationRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateNotification(ctx context.Context, n *model.Notification) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		n.ID, n.UserID, int32(n.Type), n.Message, n.IsRead, n.CreatedAt,
	)
	return err
}

func (r *postgresRepo) GetNotifications(ctx context.Context, userID string, unreadOnly bool, limit, offset int32) ([]*model.Notification, error) {
	query := `SELECT id, user_id, type, message, is_read, created_at
	          FROM notifications WHERE user_id = $1`
	args := []any{userID}

	if unreadOnly {
		query += ` AND is_read = FALSE`
	}
	query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*model.Notification
	for rows.Next() {
		n := &model.Notification{}
		var nType int32
		if err := rows.Scan(&n.ID, &n.UserID, &nType, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		n.Type = model.NotificationType(nType)
		results = append(results, n)
	}
	return results, rows.Err()
}

func (r *postgresRepo) MarkAsRead(ctx context.Context, notificationID, userID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE notifications SET is_read = TRUE
		 WHERE id = $1 AND user_id = $2`,
		notificationID, userID,
	)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		// Either doesn't exist or belongs to a different user.
		return ErrNotFound
	}
	return nil
}
