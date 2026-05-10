package repository

import (
	"context"
	"database/sql"
	"errors"

	"payment-service/internal/model"
)

var ErrNotFound = errors.New("payment not found")

type PaymentRepository interface {
	CreatePayment(ctx context.Context, p *model.Payment) error
	GetByID(ctx context.Context, id string) (*model.Payment, error)
	GetByUserID(ctx context.Context, userID string, limit, offset int32) ([]*model.Payment, error)
	UpdateStatus(ctx context.Context, id string, status model.PaymentStatus) (*model.Payment, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) PaymentRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreatePayment(ctx context.Context, p *model.Payment) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO payments (id, user_id, course_id, amount, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		p.ID, p.UserID, p.CourseID, p.Amount, string(p.Status), p.CreatedAt,
	)
	return err
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*model.Payment, error) {
	p := &model.Payment{}
	var statusStr string
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, course_id, amount, status, created_at FROM payments WHERE id = $1`, id,
	).Scan(&p.ID, &p.UserID, &p.CourseID, &p.Amount, &statusStr, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Status = model.PaymentStatus(statusStr)
	return p, nil
}

func (r *postgresRepo) GetByUserID(ctx context.Context, userID string, limit, offset int32) ([]*model.Payment, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, course_id, amount, status, created_at
		 FROM payments WHERE user_id = $1
		 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Payment
	for rows.Next() {
		p := &model.Payment{}
		var statusStr string
		if err := rows.Scan(&p.ID, &p.UserID, &p.CourseID, &p.Amount, &statusStr, &p.CreatedAt); err != nil {
			return nil, err
		}
		p.Status = model.PaymentStatus(statusStr)
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *postgresRepo) UpdateStatus(ctx context.Context, id string, status model.PaymentStatus) (*model.Payment, error) {
	p := &model.Payment{}
	var statusStr string
	err := r.db.QueryRowContext(ctx,
		`UPDATE payments SET status = $1 WHERE id = $2
		 RETURNING id, user_id, course_id, amount, status, created_at`,
		string(status), id,
	).Scan(&p.ID, &p.UserID, &p.CourseID, &p.Amount, &statusStr, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Status = model.PaymentStatus(statusStr)
	return p, nil
}
