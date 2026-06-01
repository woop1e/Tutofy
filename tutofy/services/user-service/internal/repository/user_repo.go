package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"user-service/internal/model"
)

var ErrNotFound = errors.New("user not found")

type UserRepository interface {
	CreateUser(ctx context.Context, id, email, name, role string) error
	GetByID(ctx context.Context, id string) (*model.User, error)
	UpdateUser(ctx context.Context, id, name, email string) (*model.User, error)
	GetAllUsers(ctx context.Context, limit, offset int32) ([]*model.User, error)
	DeleteUser(ctx context.Context, id string) error
	GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error)
	UpdateTutorProfile(ctx context.Context, tutorID string, p model.TutorProfile, resetStatus bool) (*model.TutorProfile, error)
	SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error)
	ApproveTutor(ctx context.Context, tutorID string) error
	RejectTutor(ctx context.Context, tutorID string) error
	GetPendingTutors(ctx context.Context) ([]*model.TutorProfile, error)
	GetTutorsByStatus(ctx context.Context, statusFilter string) ([]*model.TutorProfile, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) UserRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) CreateUser(ctx context.Context, id, email, name, role string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
		id, email, name, role,
	)
	return err
}

func (r *postgresRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, email, name, role FROM users WHERE id = $1 AND deleted_at IS NULL`, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *postgresRepo) UpdateUser(ctx context.Context, id, name, email string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRowContext(ctx,
		`UPDATE users SET name = $1, email = $2 WHERE id = $3
		 RETURNING id, email, name, role`,
		name, email, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *postgresRepo) DeleteUser(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgresRepo) GetAllUsers(ctx context.Context, limit, offset int32) ([]*model.User, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, email, name, role FROM users WHERE deleted_at IS NULL ORDER BY id LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

const tutorSelectCols = `id, name, email, bio, COALESCE(age, 0), location, photo_url, subjects, experience_years, certificates,
	COALESCE(status,'pending'), COALESCE(phone,''), COALESCE(teaching_language,''), COALESCE(student_level,''),
	COALESCE(lesson_type,''), COALESCE(hourly_price,0), COALESCE(education,''),
	COALESCE(available_days,'[]'), COALESCE(available_time_start,''), COALESCE(available_time_end,''), COALESCE(timezone,'')`

func scanTutorProfile(row interface {
	Scan(...interface{}) error
}) (*model.TutorProfile, error) {
	p := &model.TutorProfile{}
	err := row.Scan(
		&p.ID, &p.Name, &p.Email, &p.Bio, &p.Age, &p.Location, &p.PhotoURL,
		&p.Subjects, &p.ExperienceYears, &p.Certificates,
		&p.Status, &p.Phone, &p.TeachingLanguage, &p.StudentLevel,
		&p.LessonType, &p.HourlyPrice, &p.Education,
		&p.AvailableDays, &p.AvailableTimeStart, &p.AvailableTimeEnd, &p.Timezone,
	)
	return p, err
}

func (r *postgresRepo) GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT `+tutorSelectCols+` FROM users WHERE id = $1 AND role = 'tutor' AND deleted_at IS NULL`, tutorID,
	)
	p, err := scanTutorProfile(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return p, err
}

func (r *postgresRepo) UpdateTutorProfile(ctx context.Context, tutorID string, in model.TutorProfile, resetStatus bool) (*model.TutorProfile, error) {
	statusClause := ""
	if resetStatus {
		statusClause = ", status = 'pending'"
	}
	row := r.db.QueryRowContext(ctx,
		`UPDATE users
		 SET bio = $1, age = $2, location = $3, photo_url = $4, subjects = $5, experience_years = $6, certificates = $7,
		     phone = $8, teaching_language = $9, student_level = $10, lesson_type = $11,
		     hourly_price = $12, education = $13, available_days = $14,
		     available_time_start = $15, available_time_end = $16, timezone = $17,
		     updated_at = NOW()`+statusClause+`
		 WHERE id = $18 AND role = 'tutor' AND deleted_at IS NULL
		 RETURNING `+tutorSelectCols,
		in.Bio, in.Age, in.Location, in.PhotoURL, in.Subjects, in.ExperienceYears, in.Certificates,
		in.Phone, in.TeachingLanguage, in.StudentLevel, in.LessonType,
		in.HourlyPrice, in.Education, in.AvailableDays,
		in.AvailableTimeStart, in.AvailableTimeEnd, in.Timezone,
		tutorID,
	)
	p, err := scanTutorProfile(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return p, err
}

func (r *postgresRepo) SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error) {
	q := `SELECT ` + tutorSelectCols + `
	      FROM users
	      WHERE role = 'tutor' AND deleted_at IS NULL AND COALESCE(status,'pending') = 'approved'`
	args := []any{}
	n := 1
	if subject != "" {
		q += ` AND subjects ILIKE $` + itoa(n)
		args = append(args, "%"+subject+"%")
		n++
	}
	if location != "" {
		q += ` AND location ILIKE $` + itoa(n)
		args = append(args, "%"+location+"%")
		n++
	}
	if minAge > 0 {
		q += ` AND COALESCE(age, 0) >= $` + itoa(n)
		args = append(args, minAge)
		n++
	}
	if maxAge > 0 {
		q += ` AND COALESCE(age, 0) <= $` + itoa(n)
		args = append(args, maxAge)
		n++
	}
	q += ` ORDER BY name LIMIT $` + itoa(n) + ` OFFSET $` + itoa(n+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.TutorProfile
	for rows.Next() {
		p, err := scanTutorProfile(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetPendingTutors(ctx context.Context) ([]*model.TutorProfile, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+tutorSelectCols+` FROM users WHERE role = 'tutor' AND deleted_at IS NULL AND COALESCE(status,'pending') = 'pending' ORDER BY name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.TutorProfile
	for rows.Next() {
		p, err := scanTutorProfile(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *postgresRepo) GetTutorsByStatus(ctx context.Context, statusFilter string) ([]*model.TutorProfile, error) {
	var (
		rows *sql.Rows
		err  error
	)
	if statusFilter == "" || statusFilter == "all" {
		rows, err = r.db.QueryContext(ctx,
			`SELECT `+tutorSelectCols+` FROM users WHERE role = 'tutor' AND deleted_at IS NULL ORDER BY name`,
		)
	} else {
		rows, err = r.db.QueryContext(ctx,
			`SELECT `+tutorSelectCols+` FROM users WHERE role = 'tutor' AND deleted_at IS NULL AND COALESCE(status,'pending') = $1 ORDER BY name`,
			statusFilter,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*model.TutorProfile
	for rows.Next() {
		p, err := scanTutorProfile(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *postgresRepo) ApproveTutor(ctx context.Context, tutorID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1 AND role = 'tutor' AND deleted_at IS NULL`,
		tutorID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgresRepo) RejectTutor(ctx context.Context, tutorID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND role = 'tutor' AND deleted_at IS NULL`,
		tutorID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func itoa(n int) string {
	return fmt.Sprintf("%d", n)
}
