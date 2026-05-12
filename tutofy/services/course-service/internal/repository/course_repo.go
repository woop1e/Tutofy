package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"course-service/internal/model"
)

var ErrNotFound = errors.New("course not found")

const cols = `id, title, description, tutor_id, price, course_type, max_students,
              COALESCE(enrollment_deadline::TEXT, ''), is_published`

type CourseRepository interface {
	CreateCourse(ctx context.Context, course *model.Course) error
	GetCourseByID(ctx context.Context, id string) (*model.Course, error)
	GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error)
	UpdateCourse(ctx context.Context, id, title, description, courseType string, maxStudents int32, enrollmentDeadline string) (*model.Course, error)
	PublishCourse(ctx context.Context, id, tutorID, callerRole string) (*model.Course, error)
	SearchCourses(ctx context.Context, tutorID, tag, courseType string, minPrice, maxPrice float64, limit, offset int32) ([]*model.Course, error)
	DeleteCourse(ctx context.Context, id string) error
	UpsertTag(ctx context.Context, tagID, name string) error
	EnsureTag(ctx context.Context, suggestedID, name string) (string, error)
	AddCourseTag(ctx context.Context, courseID, tagID string) error
	RemoveCourseTag(ctx context.Context, courseID, tagName string) error
	GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error)
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) CourseRepository { return &postgresRepo{db: db} }

func scanCourse(row interface{ Scan(...any) error }) (*model.Course, error) {
	c := &model.Course{}
	err := row.Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price,
		&c.CourseType, &c.MaxStudents, &c.EnrollmentDeadline, &c.IsPublished)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

func (r *postgresRepo) CreateCourse(ctx context.Context, course *model.Course) error {
	deadline := sql.NullString{String: course.EnrollmentDeadline, Valid: course.EnrollmentDeadline != ""}
	courseType := course.CourseType
	if courseType == "" {
		courseType = "group"
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO courses (id, title, description, tutor_id, price, course_type, max_students, enrollment_deadline)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		course.ID, course.Title, course.Description, course.TutorID, course.Price,
		courseType, course.MaxStudents, deadline,
	)
	return err
}

func (r *postgresRepo) GetCourseByID(ctx context.Context, id string) (*model.Course, error) {
	return scanCourse(r.db.QueryRowContext(ctx,
		`SELECT `+cols+` FROM courses WHERE id = $1 AND deleted_at IS NULL`, id,
	))
}

func (r *postgresRepo) GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+cols+` FROM courses WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCourses(rows)
}

func (r *postgresRepo) UpdateCourse(ctx context.Context, id, title, description, courseType string, maxStudents int32, enrollmentDeadline string) (*model.Course, error) {
	deadline := sql.NullString{String: enrollmentDeadline, Valid: enrollmentDeadline != ""}
	return scanCourse(r.db.QueryRowContext(ctx,
		`UPDATE courses SET title=$1, description=$2, course_type=$3, max_students=$4, enrollment_deadline=$5
		 WHERE id=$6 AND deleted_at IS NULL
		 RETURNING `+cols,
		title, description, courseType, maxStudents, deadline, id,
	))
}

func (r *postgresRepo) PublishCourse(ctx context.Context, id, tutorID, callerRole string) (*model.Course, error) {
	// Admins can publish any course; tutors only their own.
	var err error
	if callerRole == "admin" {
		_, err = r.db.ExecContext(ctx,
			`UPDATE courses SET is_published = TRUE WHERE id = $1 AND deleted_at IS NULL`, id,
		)
	} else {
		var res sql.Result
		res, err = r.db.ExecContext(ctx,
			`UPDATE courses SET is_published = TRUE WHERE id = $1 AND tutor_id = $2 AND deleted_at IS NULL`,
			id, tutorID,
		)
		if err == nil {
			n, _ := res.RowsAffected()
			if n == 0 {
				return nil, ErrNotFound
			}
		}
	}
	if err != nil {
		return nil, err
	}
	return r.GetCourseByID(ctx, id)
}

func (r *postgresRepo) DeleteCourse(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `UPDATE courses SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgresRepo) UpsertTag(ctx context.Context, tagID, name string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO tags (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, tagID, name,
	)
	return err
}

func (r *postgresRepo) EnsureTag(ctx context.Context, suggestedID, name string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO tags (id, name) VALUES ($1, $2)
		 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
		suggestedID, name,
	).Scan(&id)
	return id, err
}

func (r *postgresRepo) AddCourseTag(ctx context.Context, courseID, tagID string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO course_tags (course_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		courseID, tagID,
	)
	return err
}

func (r *postgresRepo) RemoveCourseTag(ctx context.Context, courseID, tagName string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM course_tags WHERE course_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)`,
		courseID, tagName,
	)
	return err
}

func (r *postgresRepo) GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+cols+`
		 FROM courses c
		 JOIN course_tags ct ON ct.course_id = c.id
		 JOIN tags t ON t.id = ct.tag_id
		 WHERE t.name = $1 AND c.deleted_at IS NULL
		 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
		tagName, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCourses(rows)
}

func scanCourses(rows *sql.Rows) ([]*model.Course, error) {
	var result []*model.Course
	for rows.Next() {
		c := &model.Course{}
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price,
			&c.CourseType, &c.MaxStudents, &c.EnrollmentDeadline, &c.IsPublished); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *postgresRepo) SearchCourses(ctx context.Context, tutorID, tag, courseType string, minPrice, maxPrice float64, limit, offset int32) ([]*model.Course, error) {
	q := `SELECT ` + cols + ` FROM courses WHERE is_published = TRUE AND deleted_at IS NULL`
	args := []any{}
	n := 1
	if tutorID != "" {
		q += ` AND tutor_id = $` + fmt.Sprintf("%d", n)
		args = append(args, tutorID)
		n++
	}
	if courseType != "" {
		q += ` AND course_type = $` + fmt.Sprintf("%d", n)
		args = append(args, courseType)
		n++
	}
	if minPrice > 0 {
		q += ` AND price >= $` + fmt.Sprintf("%d", n)
		args = append(args, minPrice)
		n++
	}
	if maxPrice > 0 {
		q += ` AND price <= $` + fmt.Sprintf("%d", n)
		args = append(args, maxPrice)
		n++
	}
	if tag != "" {
		q += ` AND id IN (SELECT course_id FROM course_tags ct JOIN tags t ON t.id = ct.tag_id WHERE t.name = $` + fmt.Sprintf("%d", n) + `)`
		args = append(args, tag)
		n++
	}
	q += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", n) + ` OFFSET $` + fmt.Sprintf("%d", n+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanCourses(rows)
}
