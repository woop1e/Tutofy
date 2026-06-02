package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"lesson-service/internal/model"
)

var ErrNotFound = errors.New("lesson not found")

// LessonRepository is the data-access contract.
type LessonRepository interface {
	CreateLesson(ctx context.Context, lesson *model.Lesson) error
	GetLessonByID(ctx context.Context, id string) (*model.Lesson, error)
	GetCourseLessons(ctx context.Context, courseID string, limit, offset int32) ([]*model.Lesson, error)
	UpdateLessonStatus(ctx context.Context, id string, status model.LessonStatus) (*model.Lesson, error)
	UpdateLessonStatusAndDeadline(ctx context.Context, id string, status model.LessonStatus, deadline time.Time) (*model.Lesson, error)
	UpdateVideoLink(ctx context.Context, lessonID, videoLink string) (*model.Lesson, error)
	SetCalendarEventID(ctx context.Context, lessonID, calendarEventID string) error
	DeleteLesson(ctx context.Context, id string) error
	UpsertAttendance(ctx context.Context, lessonID, studentID, status string) error
	GetAttendance(ctx context.Context, lessonID, callerID, callerRole string) ([]*AttendanceRow, error)
	GetLessonsInRange(ctx context.Context, courseIDs []string, tutorID, fromDate, toDate string) ([]*model.Lesson, error)
	AddMaterial(ctx context.Context, id, lessonID, fileID, title string) error
	GetLessonMaterials(ctx context.Context, lessonID string) ([]*LessonMaterial, error)
	GetStudentLessons(ctx context.Context, studentID string) ([]*model.Lesson, error)
	GetTutorBookedSlots(ctx context.Context, tutorID string) ([]time.Time, error)
	GetTutorIndividualLessons(ctx context.Context, tutorID string) ([]*model.Lesson, error)
	ExpireOverduePayments(ctx context.Context) ([]*model.Lesson, error)
	GetCourseAttendanceSummary(ctx context.Context, courseID string) (map[string][2]int32, error)
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

const lessonColumns = `id, course_id, tutor_id, student_id, title, scheduled_at, duration_minutes, video_link, status, COALESCE(price, 0), payment_deadline, COALESCE(calendar_event_id, '')`

func (r *postgresRepo) CreateLesson(ctx context.Context, lesson *model.Lesson) error {
	var deadline *time.Time
	if !lesson.PaymentDeadline.IsZero() {
		deadline = &lesson.PaymentDeadline
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO lessons (id, course_id, tutor_id, student_id, title, scheduled_at, duration_minutes, video_link, status, price, payment_deadline, calendar_event_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		lesson.ID, lesson.CourseID, lesson.TutorID, lesson.StudentID, lesson.Title,
		lesson.ScheduledAt, lesson.DurationMinutes, lesson.VideoLink, int32(lesson.Status), lesson.Price,
		deadline, lesson.CalendarEventID,
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

func (r *postgresRepo) UpdateVideoLink(ctx context.Context, lessonID, videoLink string) (*model.Lesson, error) {
	row := r.db.QueryRowContext(ctx,
		`UPDATE lessons SET video_link = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING `+lessonColumns,
		videoLink, lessonID,
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

func (r *postgresRepo) UpdateLessonStatusAndDeadline(ctx context.Context, id string, status model.LessonStatus, deadline time.Time) (*model.Lesson, error) {
	var d *time.Time
	if !deadline.IsZero() {
		d = &deadline
	}
	row := r.db.QueryRowContext(ctx,
		`UPDATE lessons SET status = $1, payment_deadline = $2 WHERE id = $3 RETURNING `+lessonColumns,
		int32(status), d, id,
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

func (r *postgresRepo) SetCalendarEventID(ctx context.Context, lessonID, calendarEventID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE lessons SET calendar_event_id = $1 WHERE id = $2 AND deleted_at IS NULL`,
		calendarEventID, lessonID,
	)
	return err
}

func (r *postgresRepo) ExpireOverduePayments(ctx context.Context) ([]*model.Lesson, error) {
	rows, err := r.db.QueryContext(ctx,
		`UPDATE lessons SET status = $1
		 WHERE status = $2 AND payment_deadline IS NOT NULL AND payment_deadline < NOW() AND deleted_at IS NULL
		 RETURNING `+lessonColumns,
		int32(model.LessonStatusPaymentExpired), int32(model.LessonStatusAwaitingPayment),
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
	var deadline sql.NullTime
	err := s.Scan(
		&l.ID, &l.CourseID, &l.TutorID, &l.StudentID, &l.Title,
		&l.ScheduledAt, &l.DurationMinutes, &l.VideoLink, &status, &l.Price,
		&deadline, &l.CalendarEventID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	l.Status = model.LessonStatus(status)
	if deadline.Valid {
		l.PaymentDeadline = deadline.Time
	}
	return l, nil
}

func scanLessonRow(rows *sql.Rows) (*model.Lesson, error) {
	l := &model.Lesson{}
	var status int32
	var deadline sql.NullTime
	err := rows.Scan(
		&l.ID, &l.CourseID, &l.TutorID, &l.StudentID, &l.Title,
		&l.ScheduledAt, &l.DurationMinutes, &l.VideoLink, &status, &l.Price,
		&deadline, &l.CalendarEventID,
	)
	if err != nil {
		return nil, err
	}
	l.Status = model.LessonStatus(status)
	if deadline.Valid {
		l.PaymentDeadline = deadline.Time
	}
	return l, nil
}

func (r *postgresRepo) UpsertAttendance(ctx context.Context, lessonID, studentID, status string) error {
	attended := status == "present"
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO lesson_attendance (lesson_id, student_id, attended, status)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (lesson_id, student_id) DO UPDATE SET attended = EXCLUDED.attended, status = EXCLUDED.status`,
		lessonID, studentID, attended, status,
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

// GetStudentLessons returns individual (non-course) lessons booked by the given student.
func (r *postgresRepo) GetStudentLessons(ctx context.Context, studentID string) ([]*model.Lesson, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+lessonColumns+`
		 FROM lessons
		 WHERE student_id = $1 AND course_id = '' AND deleted_at IS NULL
		   AND status NOT IN ($2, $3)
		 ORDER BY scheduled_at ASC`,
		studentID, int32(model.LessonStatusPaymentExpired), int32(model.LessonStatusCancelled),
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

type AttendanceRow struct {
	LessonID  string
	StudentID string
	Attended  bool
	Status    string
}

// GetTutorIndividualLessons returns all individual (non-course) lessons for a tutor.
func (r *postgresRepo) GetTutorIndividualLessons(ctx context.Context, tutorID string) ([]*model.Lesson, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+lessonColumns+` FROM lessons
		 WHERE tutor_id = $1 AND course_id = '' AND deleted_at IS NULL
		   AND status NOT IN ($2, $3)
		 ORDER BY scheduled_at DESC`,
		tutorID, int32(model.LessonStatusPaymentExpired), int32(model.LessonStatusCancelled),
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

// GetTutorBookedSlots returns the scheduled_at times of all upcoming, non-cancelled
// individual (non-course) lessons for a given tutor. Used by the public marketplace
// profile page to hide already-booked hour-slots from new students.
func (r *postgresRepo) GetTutorBookedSlots(ctx context.Context, tutorID string) ([]time.Time, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT scheduled_at FROM lessons
		 WHERE tutor_id = $1 AND course_id = '' AND deleted_at IS NULL
		   AND status NOT IN ($2, $3)
		   AND scheduled_at > NOW()
		 ORDER BY scheduled_at ASC`,
		tutorID, int32(model.LessonStatusCancelled), int32(model.LessonStatusPaymentExpired),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var slots []time.Time
	for rows.Next() {
		var t time.Time
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		slots = append(slots, t)
	}
	return slots, rows.Err()
}

func (r *postgresRepo) GetAttendance(ctx context.Context, lessonID, callerID, callerRole string) ([]*AttendanceRow, error) {
	var rows *sql.Rows
	var err error
	if callerRole == "student" {
		// Student sees only their own record
		rows, err = r.db.QueryContext(ctx,
			`SELECT lesson_id, student_id, attended, COALESCE(status,'absent') FROM lesson_attendance WHERE lesson_id = $1 AND student_id = $2`,
			lessonID, callerID,
		)
	} else {
		// Tutor/admin sees all
		rows, err = r.db.QueryContext(ctx,
			`SELECT lesson_id, student_id, attended, COALESCE(status,'absent') FROM lesson_attendance WHERE lesson_id = $1`,
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
		if err := rows.Scan(&a.LessonID, &a.StudentID, &a.Attended, &a.Status); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

// GetCourseAttendanceSummary returns per-student attendance counts for completed lessons in a course.
// Returns map[studentID] -> [2]int32{attended, total}
func (r *postgresRepo) GetCourseAttendanceSummary(ctx context.Context, courseID string) (map[string][2]int32, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT la.student_id,
			COUNT(CASE WHEN la.status = 'present' THEN 1 END)::INT AS attended,
			COUNT(*)::INT AS total
		FROM lesson_attendance la
		JOIN lessons l ON l.id = la.lesson_id
		WHERE l.course_id = $1 AND l.status = $2 AND l.deleted_at IS NULL
		GROUP BY la.student_id`,
		courseID, int32(model.LessonStatusCompleted),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make(map[string][2]int32)
	for rows.Next() {
		var studentID string
		var attended, total int32
		if err := rows.Scan(&studentID, &attended, &total); err != nil {
			return nil, err
		}
		result[studentID] = [2]int32{attended, total}
	}
	return result, rows.Err()
}
