package repository

import (
	"context"
	"database/sql"
	"errors"

	"submission-service/internal/model"
)

var ErrNotFound = errors.New("submission not found")
var ErrAlreadySubmitted = errors.New("already submitted")

type SubmissionRepository interface {
	Create(ctx context.Context, s *model.Submission) error
	GetByAssignmentAndStudent(ctx context.Context, assignmentID, studentID string) (*model.Submission, error)
	GetByAssignment(ctx context.Context, assignmentID string, limit, offset int32) ([]*model.Submission, error)
	UpdateStatus(ctx context.Context, assignmentID, studentID string, status model.SubmissionStatus) (*model.Submission, error)
}

type postgresRepo struct{ db *sql.DB }

func NewPostgresRepo(db *sql.DB) SubmissionRepository { return &postgresRepo{db: db} }

func (r *postgresRepo) Create(ctx context.Context, s *model.Submission) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO submissions (id, assignment_id, student_id, content, file_id, status, submitted_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (assignment_id, student_id) DO NOTHING`,
		s.ID, s.AssignmentID, s.StudentID, s.Content, s.FileID, string(s.Status), s.SubmittedAt,
	)
	return err
}

func (r *postgresRepo) GetByAssignmentAndStudent(ctx context.Context, assignmentID, studentID string) (*model.Submission, error) {
	s := &model.Submission{}
	var st string
	err := r.db.QueryRowContext(ctx,
		`SELECT id, assignment_id, student_id, content, file_id, status, submitted_at
		 FROM submissions WHERE assignment_id = $1 AND student_id = $2`,
		assignmentID, studentID,
	).Scan(&s.ID, &s.AssignmentID, &s.StudentID, &s.Content, &s.FileID, &st, &s.SubmittedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	s.Status = model.SubmissionStatus(st)
	return s, nil
}

func (r *postgresRepo) GetByAssignment(ctx context.Context, assignmentID string, limit, offset int32) ([]*model.Submission, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, assignment_id, student_id, content, file_id, status, submitted_at
		 FROM submissions WHERE assignment_id = $1
		 ORDER BY submitted_at DESC LIMIT $2 OFFSET $3`,
		assignmentID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.Submission
	for rows.Next() {
		s := &model.Submission{}
		var st string
		if err := rows.Scan(&s.ID, &s.AssignmentID, &s.StudentID, &s.Content, &s.FileID, &st, &s.SubmittedAt); err != nil {
			return nil, err
		}
		s.Status = model.SubmissionStatus(st)
		result = append(result, s)
	}
	return result, rows.Err()
}

func (r *postgresRepo) UpdateStatus(ctx context.Context, assignmentID, studentID string, status model.SubmissionStatus) (*model.Submission, error) {
	s := &model.Submission{}
	var st string
	err := r.db.QueryRowContext(ctx,
		`UPDATE submissions SET status = $1
		 WHERE assignment_id = $2 AND student_id = $3
		 RETURNING id, assignment_id, student_id, content, file_id, status, submitted_at`,
		string(status), assignmentID, studentID,
	).Scan(&s.ID, &s.AssignmentID, &s.StudentID, &s.Content, &s.FileID, &st, &s.SubmittedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	s.Status = model.SubmissionStatus(st)
	return s, nil
}
