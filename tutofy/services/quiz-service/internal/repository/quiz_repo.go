package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"quiz-service/internal/model"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("attempt already submitted")
)

type QuizRepository interface {
	CreateQuiz(ctx context.Context, q *model.Quiz) error
	AddQuestion(ctx context.Context, q *model.Question) error
	AddOption(ctx context.Context, o *model.Option) error
	DeleteQuiz(ctx context.Context, id string) error
	GetQuizByID(ctx context.Context, id string) (*model.Quiz, error)
	GetCourseQuizzes(ctx context.Context, courseID string) ([]*model.Quiz, error)
	GetQuestionsWithOptions(ctx context.Context, quizID string) ([]*model.Question, error)
	CreateAttempt(ctx context.Context, a *model.QuizAttempt) error
	GetAttempt(ctx context.Context, attemptID string) (*model.QuizAttempt, error)
	SaveAnswers(ctx context.Context, answers []*model.AttemptAnswer) error
	CompleteAttempt(ctx context.Context, attemptID string, score, total int, completedAt time.Time) error
	GetAttemptAnswers(ctx context.Context, attemptID string) ([]*model.AttemptAnswer, error)
	CountCompletedAttempts(ctx context.Context, quizID, studentID string) (int, error)
	UpdateQuizSettings(ctx context.Context, quizID string, timeLimitMinutes, maxAttempts int32, deadline *time.Time) error
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) QuizRepository { return &postgresRepo{db: db} }

func (r *postgresRepo) CreateQuiz(ctx context.Context, q *model.Quiz) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO quizzes (id, course_id, title, time_limit_minutes, max_attempts, deadline, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		q.ID, q.CourseID, q.Title, q.TimeLimitMinutes, q.MaxAttempts, q.Deadline, q.CreatedAt,
	)
	return err
}

func (r *postgresRepo) AddQuestion(ctx context.Context, q *model.Question) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO questions (id, quiz_id, text, position) VALUES ($1, $2, $3, $4)`,
		q.ID, q.QuizID, q.Text, q.Position,
	)
	return err
}

func (r *postgresRepo) AddOption(ctx context.Context, o *model.Option) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO options (id, question_id, text, is_correct) VALUES ($1, $2, $3, $4)`,
		o.ID, o.QuestionID, o.Text, o.IsCorrect,
	)
	return err
}

func (r *postgresRepo) DeleteQuiz(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM quizzes WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgresRepo) GetQuizByID(ctx context.Context, id string) (*model.Quiz, error) {
	q := &model.Quiz{}
	var deadline sql.NullTime
	err := r.db.QueryRowContext(ctx,
		`SELECT id, course_id, title, time_limit_minutes, max_attempts, deadline, created_at
		 FROM quizzes WHERE id = $1`, id,
	).Scan(&q.ID, &q.CourseID, &q.Title, &q.TimeLimitMinutes, &q.MaxAttempts, &deadline, &q.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if deadline.Valid {
		q.Deadline = &deadline.Time
	}
	return q, nil
}

func (r *postgresRepo) GetCourseQuizzes(ctx context.Context, courseID string) ([]*model.Quiz, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, course_id, title, time_limit_minutes, max_attempts, deadline, created_at
		 FROM quizzes WHERE course_id = $1 ORDER BY created_at`, courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Quiz
	for rows.Next() {
		q := &model.Quiz{}
		var deadline sql.NullTime
		if err := rows.Scan(&q.ID, &q.CourseID, &q.Title, &q.TimeLimitMinutes, &q.MaxAttempts, &deadline, &q.CreatedAt); err != nil {
			return nil, err
		}
		if deadline.Valid {
			q.Deadline = &deadline.Time
		}
		result = append(result, q)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetQuestionsWithOptions(ctx context.Context, quizID string) ([]*model.Question, error) {
	qRows, err := r.db.QueryContext(ctx,
		`SELECT id, quiz_id, text, position FROM questions WHERE quiz_id = $1 ORDER BY position`, quizID,
	)
	if err != nil {
		return nil, err
	}
	defer qRows.Close()

	var questions []*model.Question
	for qRows.Next() {
		q := &model.Question{}
		if err := qRows.Scan(&q.ID, &q.QuizID, &q.Text, &q.Position); err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}

	for _, q := range questions {
		oRows, err := r.db.QueryContext(ctx,
			`SELECT id, question_id, text, is_correct FROM options WHERE question_id = $1`, q.ID,
		)
		if err != nil {
			return nil, err
		}
		for oRows.Next() {
			o := &model.Option{}
			if err := oRows.Scan(&o.ID, &o.QuestionID, &o.Text, &o.IsCorrect); err != nil {
				oRows.Close()
				return nil, err
			}
			q.Options = append(q.Options, o)
		}
		oRows.Close()
	}
	return questions, nil
}

func (r *postgresRepo) CreateAttempt(ctx context.Context, a *model.QuizAttempt) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO quiz_attempts (id, quiz_id, student_id, score, total, started_at)
		 VALUES ($1, $2, $3, 0, 0, $4)`,
		a.ID, a.QuizID, a.StudentID, a.StartedAt,
	)
	return err
}

func (r *postgresRepo) GetAttempt(ctx context.Context, attemptID string) (*model.QuizAttempt, error) {
	a := &model.QuizAttempt{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, quiz_id, student_id, score, total, started_at, completed_at
		 FROM quiz_attempts WHERE id = $1`, attemptID,
	).Scan(&a.ID, &a.QuizID, &a.StudentID, &a.Score, &a.Total, &a.StartedAt, &a.CompletedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return a, err
}

func (r *postgresRepo) SaveAnswers(ctx context.Context, answers []*model.AttemptAnswer) error {
	for _, ans := range answers {
		_, err := r.db.ExecContext(ctx,
			`INSERT INTO attempt_answers (attempt_id, question_id, option_id) VALUES ($1, $2, $3)
			 ON CONFLICT (attempt_id, question_id) DO UPDATE SET option_id = EXCLUDED.option_id`,
			ans.AttemptID, ans.QuestionID, ans.OptionID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *postgresRepo) CompleteAttempt(ctx context.Context, attemptID string, score, total int, completedAt time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE quiz_attempts SET score = $1, total = $2, completed_at = $3 WHERE id = $4`,
		score, total, completedAt, attemptID,
	)
	return err
}

func (r *postgresRepo) GetAttemptAnswers(ctx context.Context, attemptID string) ([]*model.AttemptAnswer, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT attempt_id, question_id, option_id FROM attempt_answers WHERE attempt_id = $1`, attemptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.AttemptAnswer
	for rows.Next() {
		a := &model.AttemptAnswer{}
		if err := rows.Scan(&a.AttemptID, &a.QuestionID, &a.OptionID); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *postgresRepo) CountCompletedAttempts(ctx context.Context, quizID, studentID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM quiz_attempts
		 WHERE quiz_id = $1 AND student_id = $2 AND completed_at IS NOT NULL`,
		quizID, studentID,
	).Scan(&count)
	return count, err
}

func (r *postgresRepo) UpdateQuizSettings(ctx context.Context, quizID string, timeLimitMinutes, maxAttempts int32, deadline *time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE quizzes SET time_limit_minutes = $1, max_attempts = $2, deadline = $3 WHERE id = $4`,
		timeLimitMinutes, maxAttempts, deadline, quizID,
	)
	return err
}
