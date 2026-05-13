package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

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
	UpsertAttendance(ctx context.Context, lessonID, studentID string, attended bool) error
	GetAttendance(ctx context.Context, lessonID, callerID, callerRole string) ([]*AttendanceRow, error)
	GetLessonsInRange(ctx context.Context, courseIDs []string, tutorID, fromDate, toDate string) ([]*model.Lesson, error)
	AddMaterial(ctx context.Context, id, lessonID, fileID, title string) error
	GetLessonMaterials(ctx context.Context, lessonID string) ([]*LessonMaterial, error)
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
		`SELECT `+lessonColumns+` FROM lessons WHERE id = $1 AND deleted_at IS NULL`, id,
	)
	return scanLesson(row)
}

func (r *postgresRepo) GetCourseLessons(ctx context.Context, courseID string, limit, offset int32) ([]*model.Lesson, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+lessonColumns+` FROM lessons WHERE course_id = $1 AND deleted_at IS NULL ORDER BY scheduled_at ASC LIMIT $2 OFFSET $3`,
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
	res, err := r.db.ExecContext(ctx, `UPDATE lessons SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
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

func (r *postgresRepo) UpsertAttendance(ctx context.Context, lessonID, studentID string, attended bool) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO lesson_attendance (lesson_id, student_id, attended)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (lesson_id, student_id) DO UPDATE SET attended = EXCLUDED.attended`,
		lessonID, studentID, attended,
	)
	return err
}

func (r *postgresRepo) GetLessonsInRange(ctx context.Context, courseIDs []string, tutorID, fromDate, toDate string) ([]*model.Lesson, error) {
	var q string
	var args []any

	if tutorID != "" {
		q = `SELECT ` + lessonColumns + ` FROM lessons
		     WHERE tutor_id = $1 AND deleted_at IS NULL
		     AND scheduled_at >= $2::TIMESTAMPTZ AND scheduled_at <= $3::TIMESTAMPTZ
		     ORDER BY scheduled_at ASC`
		args = []any{tutorID, fromDate, toDate}
	} else if len(courseIDs) > 0 {
		// Build $1,$2,... for the IN clause
		placeholders := ""
		for i, id := range courseIDs {
			if i > 0 {
				placeholders += ","
			}
			placeholders += "$" + fmt.Sprintf("%d", i+1)
			args = append(args, id)
		}
		n := len(courseIDs) + 1
		args = append(args, fromDate, toDate)
		q = `SELECT ` + lessonColumns + ` FROM lessons
		     WHERE course_id IN (` + placeholders + `) AND deleted_at IS NULL
		     AND scheduled_at >= $` + fmt.Sprintf("%d", n) + `::TIMESTAMPTZ
		     AND scheduled_at <= $` + fmt.Sprintf("%d", n+1) + `::TIMESTAMPTZ
		     ORDER BY scheduled_at ASC`
	} else {
		return nil, nil
	}

	rows, err := r.db.QueryContext(ctx, q, args...)
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

type LessonMaterial struct {
	ID         string
	LessonID   string
	FileID     string
	Title      string
	UploadedAt string
}

func (r *postgresRepo) AddMaterial(ctx context.Context, id, lessonID, fileID, title string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO lesson_materials (id, lesson_id, file_id, title) VALUES ($1, $2, $3, $4)`,
		id, lessonID, fileID, title,
	)
	return err
}

func (r *postgresRepo) GetLessonMaterials(ctx context.Context, lessonID string) ([]*LessonMaterial, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, lesson_id, file_id, title, uploaded_at::TEXT FROM lesson_materials
		 WHERE lesson_id = $1 ORDER BY uploaded_at ASC`, lessonID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*LessonMaterial
	for rows.Next() {
		m := &LessonMaterial{}
		if err := rows.Scan(&m.ID, &m.LessonID, &m.FileID, &m.Title, &m.UploadedAt); err != nil {
			return nil, err
		}
		result = append(result, m)
	}
	return result, rows.Err()
}

type AttendanceRow struct {
	LessonID  string
	StudentID string
	Attended  bool
}

func (r *postgresRepo) GetAttendance(ctx context.Context, lessonID, callerID, callerRole string) ([]*AttendanceRow, error) {
	var rows *sql.Rows
	var err error
	if callerRole == "student" {
		// Student sees only their own record
		rows, err = r.db.QueryContext(ctx,
			`SELECT lesson_id, student_id, attended FROM lesson_attendance WHERE lesson_id = $1 AND student_id = $2`,
			lessonID, callerID,
		)
	} else {
		// Tutor/admin sees all
		rows, err = r.db.QueryContext(ctx,
			`SELECT lesson_id, student_id, attended FROM lesson_attendance WHERE lesson_id = $1`,
			lessonID,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*AttendanceRow
	for rows.Next() {
		a := &AttendanceRow{}
		if err := rows.Scan(&a.LessonID, &a.StudentID, &a.Attended); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}
