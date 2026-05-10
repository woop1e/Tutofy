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
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) CourseRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateCourse(ctx context.Context, course *model.Course) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO courses (id, title, description, tutor_id) VALUES ($1, $2, $3, $4)`,
		course.ID, course.Title, course.Description, course.TutorID,
	)
	return err
}

func (r *postgresRepo) GetCourseByID(ctx context.Context, id string) (*model.Course, error) {
	c := &model.Course{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, title, description, tutor_id FROM courses WHERE id = $1`, id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.TutorID)
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
		`SELECT id, title, description, tutor_id FROM courses ORDER BY id LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []*model.Course
	for rows.Next() {
		c := &model.Course{}
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TutorID); err != nil {
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
		 RETURNING id, title, description, tutor_id`,
		title, description, id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.TutorID)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return c, err
}

func (r *postgresRepo) DeleteCourse(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM courses WHERE id = $1`, id)
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
