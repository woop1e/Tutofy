package repository

import (
	"context"
	"database/sql"
	"errors"

	"lesson-service/internal/model"
)

var ErrNotFound = errors.New("lesson not found")

// LessonRepository is the data-access contract.
type LessonRepository interface {
	CreateLesson(ctx context.Context, lesson *model.Lesson) error
	GetLessonByID(ctx context.Context, id string) (*model.Lesson, error)
	GetCourseLessons(ctx context.Context, courseID string, limit, offset int32) ([]*model.Lesson, error)
	UpdateLessonStatus(ctx context.Context, id string, status model.LessonStatus) (*model.Lesson, error)
	DeleteLesson(ctx context.Context, id string) error
}

type postgresRepo struct {
	db *sql.DB
}

// NewPostgresRepo creates a PostgreSQL-backed LessonRepository.
// Expected schema:
//
//	CREATE TABLE IF NOT EXISTS lessons (
//	  id               TEXT PRIMARY KEY,
//	  course_id        TEXT        NOT NULL,
//	  tutor_id         TEXT        NOT NULL,
//	  title            TEXT        NOT NULL,
//	  scheduled_at     TIMESTAMPTZ NOT NULL,
//	  duration_minutes INTEGER     NOT NULL,
//	  video_link       TEXT        NOT NULL DEFAULT '',
//	  status           SMALLINT    NOT NULL DEFAULT 1
//	);
func NewPostgresRepo(db *sql.DB) LessonRepository {
	return &postgresRepo{db: db}
}

const lessonColumns = `id, course_id, tutor_id, title, scheduled_at, duration_minutes, video_link, status`

func (r *postgresRepo) CreateLesson(ctx context.Context, lesson *model.Lesson) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO lessons (id, course_id, tutor_id, title, scheduled_at, duration_minutes, video_link, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		lesson.ID, lesson.CourseID, lesson.TutorID, lesson.Title,
		lesson.ScheduledAt, lesson.DurationMinutes, lesson.VideoLink, int32(lesson.Status),
	)
	return err
}

func (r *postgresRepo) GetLessonByID(ctx context.Context, id string) (*model.Lesson, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT `+lessonColumns+` FROM lessons WHERE id = $1`, id,
	)
	return scanLesson(row)
}

func (r *postgresRepo) GetCourseLessons(ctx context.Context, courseID string, limit, offset int32) ([]*model.Lesson, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+lessonColumns+` FROM lessons WHERE course_id = $1 ORDER BY scheduled_at ASC LIMIT $2 OFFSET $3`,
		courseID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []*model.Lesson
	for rows.Next() {
		l, err := scanLessonRow(rows)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, l)
	}
	return lessons, rows.Err()
}

func (r *postgresRepo) UpdateLessonStatus(ctx context.Context, id string, status model.LessonStatus) (*model.Lesson, error) {
	row := r.db.QueryRowContext(ctx,
		`UPDATE lessons SET status = $1 WHERE id = $2 RETURNING `+lessonColumns,
		int32(status), id,
	)
	l, err := scanLesson(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return l, nil
}

func (r *postgresRepo) DeleteLesson(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM lessons WHERE id = $1`, id)
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

// --- scan helpers ---

type scanner interface {
	Scan(dest ...any) error
}

func scanLesson(s scanner) (*model.Lesson, error) {
	l := &model.Lesson{}
	var status int32
	err := s.Scan(
		&l.ID, &l.CourseID, &l.TutorID, &l.Title,
		&l.ScheduledAt, &l.DurationMinutes, &l.VideoLink, &status,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	l.Status = model.LessonStatus(status)
	return l, nil
}

func scanLessonRow(rows *sql.Rows) (*model.Lesson, error) {
	l := &model.Lesson{}
	var status int32
	err := rows.Scan(
		&l.ID, &l.CourseID, &l.TutorID, &l.Title,
		&l.ScheduledAt, &l.DurationMinutes, &l.VideoLink, &status,
	)
	if err != nil {
		return nil, err
	}
	l.Status = model.LessonStatus(status)
	return l, nil
}
