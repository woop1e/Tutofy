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
	CountEnrollments(ctx context.Context, courseID string) (int64, error)
	DeleteEnrollment(ctx context.Context, userID, courseID string) error
	// Enrollment request methods
	CreateEnrollmentRequest(ctx context.Context, r *model.EnrollmentRequest) error
	GetEnrollmentRequestsByCourse(ctx context.Context, courseID string) ([]*model.EnrollmentRequest, error)
	GetEnrollmentRequest(ctx context.Context, requestID string) (*model.EnrollmentRequest, error)
	UpdateEnrollmentRequestStatus(ctx context.Context, requestID, status string) error
	HasApprovedRequest(ctx context.Context, userID, courseID string) (bool, error)
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

func (r *postgresRepo) DeleteEnrollment(ctx context.Context, userID, courseID string) error {
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2`, userID, courseID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
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

func (r *postgresRepo) CountEnrollments(ctx context.Context, courseID string) (int64, error) {
	var count int64
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM enrollments WHERE course_id = $1`, courseID,
	).Scan(&count)
	return count, err
}

func (r *postgresRepo) CreateEnrollmentRequest(ctx context.Context, req *model.EnrollmentRequest) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO enrollment_requests (id, user_id, course_id, status, created_at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'pending', created_at = NOW()`,
		req.ID, req.UserID, req.CourseID, req.Status, req.CreatedAt,
	)
	return err
}

func (r *postgresRepo) GetEnrollmentRequestsByCourse(ctx context.Context, courseID string) ([]*model.EnrollmentRequest, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, course_id, status, created_at FROM enrollment_requests WHERE course_id = $1 ORDER BY created_at DESC`,
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.EnrollmentRequest
	for rows.Next() {
		req := &model.EnrollmentRequest{}
		if err := rows.Scan(&req.ID, &req.UserID, &req.CourseID, &req.Status, &req.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, req)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetEnrollmentRequest(ctx context.Context, requestID string) (*model.EnrollmentRequest, error) {
	req := &model.EnrollmentRequest{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, course_id, status, created_at FROM enrollment_requests WHERE id = $1`, requestID,
	).Scan(&req.ID, &req.UserID, &req.CourseID, &req.Status, &req.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return req, err
}

func (r *postgresRepo) UpdateEnrollmentRequestStatus(ctx context.Context, requestID, status string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE enrollment_requests SET status = $1 WHERE id = $2`, status, requestID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgresRepo) HasApprovedRequest(ctx context.Context, userID, courseID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM enrollment_requests WHERE user_id = $1 AND course_id = $2 AND status = 'approved')`,
		userID, courseID,
	).Scan(&exists)
	return exists, err
}
