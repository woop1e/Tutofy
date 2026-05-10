package repository

import (
	"context"
	"database/sql"
	"errors"

	"course-service/internal/model"
)

var ErrNotFound = errors.New("course not found")

type CourseRepository interface {
	CreateCourse(ctx context.Context, course *model.Course) error
	GetCourseByID(ctx context.Context, id string) (*model.Course, error)
	GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error)
	UpdateCourse(ctx context.Context, id, title, description string) (*model.Course, error)
	DeleteCourse(ctx context.Context, id string) error
	UpsertTag(ctx context.Context, tagID, name string) error
	EnsureTag(ctx context.Context, suggestedID, name string) (string, error)
	AddCourseTag(ctx context.Context, courseID, tagID string) error
	RemoveCourseTag(ctx context.Context, courseID, tagName string) error
	GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) CourseRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateCourse(ctx context.Context, course *model.Course) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO courses (id, title, description, tutor_id, price) VALUES ($1, $2, $3, $4, $5)`,
		course.ID, course.Title, course.Description, course.TutorID, course.Price,
	)
	return err
}

func (r *postgresRepo) GetCourseByID(ctx context.Context, id string) (*model.Course, error) {
	c := &model.Course{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, title, description, tutor_id, price FROM courses WHERE id = $1 AND deleted_at IS NULL`, id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *postgresRepo) GetAllCourses(ctx context.Context, limit, offset int32) ([]*model.Course, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, title, description, tutor_id, price FROM courses WHERE deleted_at IS NULL ORDER BY id LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []*model.Course
	for rows.Next() {
		c := &model.Course{}
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price); err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}
	return courses, rows.Err()
}

func (r *postgresRepo) UpdateCourse(ctx context.Context, id, title, description string) (*model.Course, error) {
	c := &model.Course{}
	err := r.db.QueryRowContext(ctx,
		`UPDATE courses SET title = $1, description = $2 WHERE id = $3
		 RETURNING id, title, description, tutor_id, price`,
		title, description, id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return c, err
}

func (r *postgresRepo) DeleteCourse(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `UPDATE courses SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
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

func (r *postgresRepo) UpsertTag(ctx context.Context, tagID, name string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO tags (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
		tagID, name,
	)
	return err
}

// EnsureTag inserts the tag if it doesn't exist and returns its actual ID.
func (r *postgresRepo) EnsureTag(ctx context.Context, suggestedID, name string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO tags (id, name) VALUES ($1, $2)
		 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
		 RETURNING id`,
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
		`DELETE FROM course_tags
		 WHERE course_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)`,
		courseID, tagName,
	)
	return err
}

func (r *postgresRepo) GetCoursesByTag(ctx context.Context, tagName string, limit, offset int32) ([]*model.Course, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT c.id, c.title, c.description, c.tutor_id, c.price
		 FROM courses c
		 JOIN course_tags ct ON ct.course_id = c.id
		 JOIN tags t ON t.id = ct.tag_id
		 WHERE t.name = $1 AND c.deleted_at IS NULL
		 ORDER BY c.id LIMIT $2 OFFSET $3`,
		tagName, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Course
	for rows.Next() {
		c := &model.Course{}
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TutorID, &c.Price); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}
