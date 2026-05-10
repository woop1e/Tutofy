package repository

import (
	"context"
	"database/sql"
	"errors"

	"certificate-service/internal/model"
)

var (
	ErrNotFound      = errors.New("certificate not found")
	ErrAlreadyIssued = errors.New("certificate already issued")
)

type CertificateRepository interface {
	Create(ctx context.Context, c *model.Certificate) error
	GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Certificate, error)
	GetByStudent(ctx context.Context, studentID string) ([]*model.Certificate, error)
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) CertificateRepository { return &postgresRepo{db: db} }

func (r *postgresRepo) Create(ctx context.Context, c *model.Certificate) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO certificates (id, student_id, course_id, issued_at)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (student_id, course_id) DO NOTHING`,
		c.ID, c.StudentID, c.CourseID, c.IssuedAt,
	)
	return err
}

func (r *postgresRepo) GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Certificate, error) {
	c := &model.Certificate{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, student_id, course_id, issued_at FROM certificates WHERE student_id = $1 AND course_id = $2`,
		studentID, courseID,
	).Scan(&c.ID, &c.StudentID, &c.CourseID, &c.IssuedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

func (r *postgresRepo) GetByStudent(ctx context.Context, studentID string) ([]*model.Certificate, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, student_id, course_id, issued_at FROM certificates WHERE student_id = $1 ORDER BY issued_at DESC`,
		studentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Certificate
	for rows.Next() {
		c := &model.Certificate{}
		if err := rows.Scan(&c.ID, &c.StudentID, &c.CourseID, &c.IssuedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}
