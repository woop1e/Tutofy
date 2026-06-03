package repository

import (
	"context"
	"database/sql"
	"errors"

	"certificate-service/internal/model"
)

var (
	ErrNotFound      = errors.New("certificate not found")
	ErrAlreadyIssued = errors.New("certificate already requested")
)

type CertificateRepository interface {
	Create(ctx context.Context, c *model.Certificate) error
	GetByID(ctx context.Context, id string) (*model.Certificate, error)
	GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Certificate, error)
	GetByStudent(ctx context.Context, studentID string) ([]*model.Certificate, error)
	GetPendingByTutor(ctx context.Context, tutorID string) ([]*model.Certificate, error)
	UpdateStatus(ctx context.Context, id string, status model.CertStatus) error
	GetAllPending(ctx context.Context) ([]*model.Certificate, error)
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) CertificateRepository { return &postgresRepo{db: db} }

const cols = `id, student_id, course_id, tutor_id, status, issued_at,
	COALESCE(student_name,''), COALESCE(course_name,''), COALESCE(tutor_name,'')`

func scan(row *sql.Row) (*model.Certificate, error) {
	c := &model.Certificate{}
	var st int32
	err := row.Scan(&c.ID, &c.StudentID, &c.CourseID, &c.TutorID, &st,
		&c.IssuedAt, &c.StudentName, &c.CourseName, &c.TutorName)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	c.Status = model.CertStatus(st)
	return c, err
}

func scanRow(rows *sql.Rows) (*model.Certificate, error) {
	c := &model.Certificate{}
	var st int32
	err := rows.Scan(&c.ID, &c.StudentID, &c.CourseID, &c.TutorID, &st,
		&c.IssuedAt, &c.StudentName, &c.CourseName, &c.TutorName)
	c.Status = model.CertStatus(st)
	return c, err
}

func (r *postgresRepo) Create(ctx context.Context, c *model.Certificate) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO certificates (id, student_id, course_id, tutor_id, status, issued_at, student_name, course_name, tutor_name)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 ON CONFLICT (student_id, course_id) DO NOTHING`,
		c.ID, c.StudentID, c.CourseID, c.TutorID, int32(c.Status),
		c.IssuedAt, c.StudentName, c.CourseName, c.TutorName,
	)
	return err
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*model.Certificate, error) {
	row := r.db.QueryRowContext(ctx, `SELECT `+cols+` FROM certificates WHERE id = $1`, id)
	return scan(row)
}

func (r *postgresRepo) GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Certificate, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT `+cols+` FROM certificates WHERE student_id=$1 AND course_id=$2`,
		studentID, courseID,
	)
	return scan(row)
}

func (r *postgresRepo) GetByStudent(ctx context.Context, studentID string) ([]*model.Certificate, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+cols+` FROM certificates WHERE student_id=$1 ORDER BY issued_at DESC`, studentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Certificate
	for rows.Next() {
		c, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetPendingByTutor(ctx context.Context, tutorID string) ([]*model.Certificate, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+cols+` FROM certificates WHERE tutor_id=$1 AND status=$2 ORDER BY issued_at DESC`,
		tutorID, int32(model.CertStatusPending),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Certificate
	for rows.Next() {
		c, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetAllPending(ctx context.Context) ([]*model.Certificate, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+cols+` FROM certificates WHERE status=$1 ORDER BY issued_at DESC`,
		int32(model.CertStatusPending),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Certificate
	for rows.Next() {
		c, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresRepo) UpdateStatus(ctx context.Context, id string, status model.CertStatus) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE certificates SET status=$1 WHERE id=$2`,
		int32(status), id,
	)
	return err
}
