package repository

import (
	"context"
	"database/sql"
	"errors"

	"assignment-service/internal/model"
)

var ErrNotFound = errors.New("assignment not found")

type AssignmentRepository interface {
	CreateAssignment(ctx context.Context, a *model.Assignment) error
	GetByCourseID(ctx context.Context, courseID string) ([]*model.Assignment, error)
	DeleteAssignment(ctx context.Context, id string) error
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) AssignmentRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateAssignment(ctx context.Context, a *model.Assignment) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO assignments (id, title, description, course_id) VALUES ($1, $2, $3, $4)`,
		a.ID, a.Title, a.Description, a.CourseID,
	)
	return err
}

func (r *postgresRepo) GetByCourseID(ctx context.Context, courseID string) ([]*model.Assignment, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, title, description, course_id FROM assignments WHERE course_id = $1`, courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Assignment
	for rows.Next() {
		a := &model.Assignment{}
		if err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.CourseID); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *postgresRepo) DeleteAssignment(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM assignments WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
