package repository

import (
	"context"
	"database/sql"
	"errors"

	"user-service/internal/model"
)

var ErrNotFound = errors.New("user not found")

type UserRepository interface {
	GetByID(ctx context.Context, id string) (*model.User, error)
	UpdateUser(ctx context.Context, id, name, email string) (*model.User, error)
	GetAllUsers(ctx context.Context) ([]*model.User, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) UserRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, email, name, role FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *postgresRepo) UpdateUser(ctx context.Context, id, name, email string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRowContext(ctx,
		`UPDATE users SET name = $1, email = $2 WHERE id = $3
		 RETURNING id, email, name, role`,
		name, email, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *postgresRepo) GetAllUsers(ctx context.Context) ([]*model.User, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, email, name, role FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
