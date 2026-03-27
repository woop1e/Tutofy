package repository

import (
	"context"
	"database/sql"
	"errors"

	"grading-service/internal/model"
)

var ErrNotFound = errors.New("grade not found")

type GradeRepository interface {
	CreateGrade(ctx context.Context, g *model.Grade) error
	GetGradesByStudent(ctx context.Context, studentID string) ([]*model.Grade, error)
	GetGradesByAssignment(ctx context.Context, assignmentID string) ([]*model.Grade, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) GradeRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateGrade(ctx context.Context, g *model.Grade) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO grades (id, assignment_id, student_id, grade) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (assignment_id, student_id) DO UPDATE SET grade = EXCLUDED.grade`,
		g.ID, g.AssignmentID, g.StudentID, g.Grade,
	)
	return err
}

func (r *postgresRepo) GetGradesByStudent(ctx context.Context, studentID string) ([]*model.Grade, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, assignment_id, student_id, grade FROM grades WHERE student_id = $1`, studentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Grade
	for rows.Next() {
		g := &model.Grade{}
		if err := rows.Scan(&g.ID, &g.AssignmentID, &g.StudentID, &g.Grade); err != nil {
			return nil, err
		}
		result = append(result, g)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetGradesByAssignment(ctx context.Context, assignmentID string) ([]*model.Grade, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, assignment_id, student_id, grade FROM grades WHERE assignment_id = $1`, assignmentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*model.Grade
	for rows.Next() {
		g := &model.Grade{}
		if err := rows.Scan(&g.ID, &g.AssignmentID, &g.StudentID, &g.Grade); err != nil {
			return nil, err
		}
		result = append(result, g)
	}
	return result, rows.Err()
}
