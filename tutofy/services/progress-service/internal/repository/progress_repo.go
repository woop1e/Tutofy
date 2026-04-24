package repository

import (
	"context"
	"database/sql"
	"errors"

	"progress-service/internal/model"
)

var ErrNotFound = errors.New("progress not found")

// ProgressRepository is the data-access contract.
type ProgressRepository interface {
	// UpsertLessonEvent records (or updates) a lesson event for a student/course pair.
	// It adjusts the running counters based on the previous status of the lesson
	// and the new status being recorded.
	UpsertLessonEvent(ctx context.Context, studentID, courseID, lessonID string, newStatus model.LessonStatus) error

	// GetProgress returns the aggregated progress for a student in a course.
	GetProgress(ctx context.Context, studentID, courseID string) (*model.Progress, error)

	// GetCourseProgress returns aggregated progress for all students in a course.
	GetCourseProgress(ctx context.Context, courseID string) ([]*model.Progress, error)
}

type postgresRepo struct {
	db *sql.DB
}

// NewPostgresRepo creates a new PostgreSQL-backed ProgressRepository.
// Expected schema (run once during migrations):
//
//	CREATE TABLE lesson_events (
//	  lesson_id  TEXT        NOT NULL,
//	  student_id TEXT        NOT NULL,
//	  course_id  TEXT        NOT NULL,
//	  status     SMALLINT    NOT NULL,
//	  PRIMARY KEY (lesson_id, student_id)
//	);
//
//	CREATE TABLE progress (
//	  student_id         TEXT    NOT NULL,
//	  course_id          TEXT    NOT NULL,
//	  completed_lessons  INTEGER NOT NULL DEFAULT 0,
//	  cancelled_lessons  INTEGER NOT NULL DEFAULT 0,
//	  planned_lessons    INTEGER NOT NULL DEFAULT 0,
//	  PRIMARY KEY (student_id, course_id)
//	);
func NewPostgresRepo(db *sql.DB) ProgressRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) UpsertLessonEvent(
	ctx context.Context,
	studentID, courseID, lessonID string,
	newStatus model.LessonStatus,
) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	// Find previous status for this lesson (if any).
	var prevStatus model.LessonStatus
	err = tx.QueryRowContext(ctx,
		`SELECT status FROM lesson_events WHERE lesson_id = $1 AND student_id = $2`,
		lessonID, studentID,
	).Scan(&prevStatus)

	isNew := errors.Is(err, sql.ErrNoRows)
	if err != nil && !isNew {
		return err
	}

	// Upsert the lesson event row.
	if isNew {
		if _, err = tx.ExecContext(ctx,
			`INSERT INTO lesson_events (lesson_id, student_id, course_id, status)
			 VALUES ($1, $2, $3, $4)`,
			lessonID, studentID, courseID, int32(newStatus),
		); err != nil {
			return err
		}
	} else {
		if _, err = tx.ExecContext(ctx,
			`UPDATE lesson_events SET status = $1
			 WHERE lesson_id = $2 AND student_id = $3`,
			int32(newStatus), lessonID, studentID,
		); err != nil {
			return err
		}
	}

	// Build the delta to apply to the progress counters.
	delta := buildDelta(prevStatus, newStatus, isNew)

	// Upsert the progress row.
	_, err = tx.ExecContext(ctx, `
		INSERT INTO progress (student_id, course_id, completed_lessons, cancelled_lessons, planned_lessons)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (student_id, course_id) DO UPDATE SET
		  completed_lessons = progress.completed_lessons + $3,
		  cancelled_lessons = progress.cancelled_lessons + $4,
		  planned_lessons   = progress.planned_lessons   + $5`,
		studentID, courseID,
		delta.completed, delta.cancelled, delta.planned,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *postgresRepo) GetProgress(ctx context.Context, studentID, courseID string) (*model.Progress, error) {
	p := &model.Progress{}
	err := r.db.QueryRowContext(ctx,
		`SELECT student_id, course_id, completed_lessons, cancelled_lessons, planned_lessons
		 FROM progress WHERE student_id = $1 AND course_id = $2`,
		studentID, courseID,
	).Scan(&p.StudentID, &p.CourseID, &p.CompletedLessons, &p.CancelledLessons, &p.PlannedLessons)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *postgresRepo) GetCourseProgress(ctx context.Context, courseID string) ([]*model.Progress, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT student_id, course_id, completed_lessons, cancelled_lessons, planned_lessons
		 FROM progress WHERE course_id = $1`,
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*model.Progress
	for rows.Next() {
		p := &model.Progress{}
		if err := rows.Scan(&p.StudentID, &p.CourseID, &p.CompletedLessons, &p.CancelledLessons, &p.PlannedLessons); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	return results, rows.Err()
}

// counterDelta holds the signed deltas to add to the progress counters.
type counterDelta struct {
	completed int
	cancelled int
	planned   int
}

// buildDelta calculates how the counters should change when a lesson
// moves from prevStatus → newStatus. When isNew is true prevStatus is ignored.
func buildDelta(prev, next model.LessonStatus, isNew bool) counterDelta {
	var d counterDelta

	// Subtract the old bucket (if updating an existing record).
	if !isNew {
		switch prev {
		case model.LessonStatusCompleted:
			d.completed--
		case model.LessonStatusCancelled:
			d.cancelled--
		case model.LessonStatusPlanned:
			d.planned--
		}
	}

	// Add to the new bucket.
	switch next {
	case model.LessonStatusCompleted:
		d.completed++
	case model.LessonStatusCancelled:
		d.cancelled++
	case model.LessonStatusPlanned:
		d.planned++
	}

	return d
}
