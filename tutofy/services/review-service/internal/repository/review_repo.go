package repository

import (
	"context"
	"database/sql"
	"errors"

	"review-service/internal/model"
)

var (
	ErrNotFound      = errors.New("review not found")
	ErrAlreadyExists = errors.New("already reviewed this course")
)

type ReviewRepository interface {
	Create(ctx context.Context, r *model.Review) error
	GetByCourse(ctx context.Context, courseID string, limit, offset int32) ([]*model.Review, error)
	GetRating(ctx context.Context, courseID string) (*model.CourseRating, error)
	GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Review, error)
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) ReviewRepository { return &postgresRepo{db: db} }

func (r *postgresRepo) Create(ctx context.Context, rv *model.Review) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO reviews (id, course_id, student_id, rating, body, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		rv.ID, rv.CourseID, rv.StudentID, rv.Rating, rv.Body, rv.CreatedAt,
	)
	if err != nil && err.Error() != "" {
		if isUniqueViolation(err) {
			return ErrAlreadyExists
		}
	}
	return err
}

func (r *postgresRepo) GetByCourse(ctx context.Context, courseID string, limit, offset int32) ([]*model.Review, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, course_id, student_id, rating, body, created_at
		 FROM reviews WHERE course_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		courseID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Review
	for rows.Next() {
		rv := &model.Review{}
		if err := rows.Scan(&rv.ID, &rv.CourseID, &rv.StudentID, &rv.Rating, &rv.Body, &rv.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, rv)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetRating(ctx context.Context, courseID string) (*model.CourseRating, error) {
	cr := &model.CourseRating{}
	err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE(AVG(rating::float), 0), COUNT(*) FROM reviews WHERE course_id = $1`, courseID,
	).Scan(&cr.Average, &cr.Count)
	return cr, err
}

func (r *postgresRepo) GetByStudentAndCourse(ctx context.Context, studentID, courseID string) (*model.Review, error) {
	rv := &model.Review{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, course_id, student_id, rating, body, created_at
		 FROM reviews WHERE student_id = $1 AND course_id = $2`, studentID, courseID,
	).Scan(&rv.ID, &rv.CourseID, &rv.StudentID, &rv.Rating, &rv.Body, &rv.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return rv, err
}

func isUniqueViolation(err error) bool {
	return err != nil && len(err.Error()) > 0 && (contains(err.Error(), "unique") || contains(err.Error(), "duplicate"))
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
