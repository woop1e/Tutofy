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
	GetByID(ctx context.Context, id string) (*model.Assignment, error)
	GetByCourseID(ctx context.Context, courseID string, limit, offset int32) ([]*model.Assignment, error)
	UpdateAssignment(ctx context.Context, id, title, description, dueDate string) (*model.Assignment, error)
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
		`INSERT INTO assignments (id, title, description, course_id, due_date) VALUES ($1, $2, $3, $4, NULLIF($5, ''))`,
		a.ID, a.Title, a.Description, a.CourseID, a.DueDate,
	)
	return err
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*model.Assignment, error) {
	a := &model.Assignment{}
	var dueDate sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, title, description, course_id, COALESCE(due_date::TEXT, '') FROM assignments WHERE id = $1`, id,
	).Scan(&a.ID, &a.Title, &a.Description, &a.CourseID, &dueDate)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	a.DueDate = dueDate.String
	return a, err
}

func (r *postgresRepo) GetByCourseID(ctx context.Context, courseID string, limit, offset int32) ([]*model.Assignment, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, title, description, course_id, COALESCE(due_date::TEXT, '') FROM assignments WHERE course_id = $1 ORDER BY id LIMIT $2 OFFSET $3`,
		courseID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Assignment
	for rows.Next() {
		a := &model.Assignment{}
		if err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.CourseID, &a.DueDate); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *postgresRepo) UpdateAssignment(ctx context.Context, id, title, description, dueDate string) (*model.Assignment, error) {
	a := &model.Assignment{}
	err := r.db.QueryRowContext(ctx,
		`UPDATE assignments SET title = $1, description = $2, due_date = NULLIF($3, '')
		 WHERE id = $4
		 RETURNING id, title, description, course_id, COALESCE(due_date::TEXT, '')`,
		title, description, dueDate, id,
	).Scan(&a.ID, &a.Title, &a.Description, &a.CourseID, &a.DueDate)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return a, err
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
