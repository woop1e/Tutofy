package repository

import (
	"context"
	"database/sql"
	"errors"

	"enrollment-service/internal/model"
)

var (
	ErrNotFound      = errors.New("enrollment not found")
	ErrAlreadyExists = errors.New("already enrolled")
)

type EnrollmentRepository interface {
	CreateEnrollment(ctx context.Context, e *model.Enrollment) error
	GetEnrollmentsByUser(ctx context.Context, userID string) ([]*model.Enrollment, error)
	GetEnrollmentsByCourse(ctx context.Context, courseID string) ([]*model.Enrollment, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) EnrollmentRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateEnrollment(ctx context.Context, e *model.Enrollment) error {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2)`,
		e.UserID, e.CourseID,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return ErrAlreadyExists
	}

	_, err = r.db.ExecContext(ctx,
		`INSERT INTO enrollments (id, user_id, course_id) VALUES ($1, $2, $3)`,
		e.ID, e.UserID, e.CourseID,
	)
	return err
}

func (r *postgresRepo) GetEnrollmentsByUser(ctx context.Context, userID string) ([]*model.Enrollment, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, course_id FROM enrollments WHERE user_id = $1`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Enrollment
	for rows.Next() {
		e := &model.Enrollment{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetEnrollmentsByCourse(ctx context.Context, courseID string) ([]*model.Enrollment, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, course_id FROM enrollments WHERE course_id = $1`, courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Enrollment
	for rows.Next() {
		e := &model.Enrollment{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, rows.Err()
}
