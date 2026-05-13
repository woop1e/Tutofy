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
	GetByID(ctx context.Context, id string) (*model.User, error)
	UpdateUser(ctx context.Context, id, name, email string) (*model.User, error)
	GetAllUsers(ctx context.Context, limit, offset int32) ([]*model.User, error)
	DeleteUser(ctx context.Context, id string) error
	GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error)
	UpdateTutorProfile(ctx context.Context, tutorID, bio, location, photoURL, subjects, certificates string, age, experienceYears int32) (*model.TutorProfile, error)
	SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error)
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) UserRepository {
	return &postgresRepo{db: db}
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

func (r *postgresRepo) GetTutorProfile(ctx context.Context, tutorID string) (*model.TutorProfile, error) {
	p := &model.TutorProfile{}
	var age sql.NullInt32
	err := r.db.QueryRowContext(ctx,
		`SELECT id, name, email, bio, age, location, photo_url, subjects, experience_years, certificates
		 FROM users WHERE id = $1 AND role = 'tutor' AND deleted_at IS NULL`, tutorID,
	).Scan(&p.ID, &p.Name, &p.Email, &p.Bio, &age, &p.Location, &p.PhotoURL, &p.Subjects, &p.ExperienceYears, &p.Certificates)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if age.Valid {
		p.Age = age.Int32
	}
	return p, nil
}

func (r *postgresRepo) UpdateTutorProfile(ctx context.Context, tutorID, bio, location, photoURL, subjects, certificates string, age, experienceYears int32) (*model.TutorProfile, error) {
	p := &model.TutorProfile{}
	var dbAge sql.NullInt32
	err := r.db.QueryRowContext(ctx,
		`UPDATE users
		 SET bio = $1, age = $2, location = $3, photo_url = $4, subjects = $5, experience_years = $6, certificates = $7, updated_at = NOW()
		 WHERE id = $8 AND role = 'tutor' AND deleted_at IS NULL
		 RETURNING id, name, email, bio, age, location, photo_url, subjects, experience_years, certificates`,
		bio, age, location, photoURL, subjects, experienceYears, certificates, tutorID,
	).Scan(&p.ID, &p.Name, &p.Email, &p.Bio, &dbAge, &p.Location, &p.PhotoURL, &p.Subjects, &p.ExperienceYears, &p.Certificates)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if dbAge.Valid {
		p.Age = dbAge.Int32
	}
	return p, nil
}

func (r *postgresRepo) SearchTutors(ctx context.Context, subject, location string, minAge, maxAge, limit, offset int32) ([]*model.TutorProfile, error) {
	q := `SELECT id, name, email, bio, COALESCE(age, 0), location, photo_url, subjects, experience_years, certificates
	      FROM users
	      WHERE role = 'tutor' AND deleted_at IS NULL`
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
		p := &model.TutorProfile{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Email, &p.Bio, &p.Age, &p.Location, &p.PhotoURL, &p.Subjects, &p.ExperienceYears, &p.Certificates); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func itoa(n int) string {
	return fmt.Sprintf("%d", n)
}
