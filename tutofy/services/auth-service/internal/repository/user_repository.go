package repository

import (
	"auth-service/internal/model"
	"database/sql"
	"errors"
	"time"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *model.User) error {
	query := `INSERT INTO users (id, email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(query, user.ID, user.Email, user.Password, user.Name, user.Role, user.EmailVerified)
	return err
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, email, password, name, role, email_verified FROM users WHERE email = $1`
	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role, &user.EmailVerified)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) GetUserByID(id string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, email, password, name, role, email_verified FROM users WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role, &user.EmailVerified)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) SetEmailVerified(userID string) error {
	_, err := r.db.Exec(`UPDATE users SET email_verified = true WHERE id = $1`, userID)
	return err
}

func (r *UserRepository) DeleteUser(id string) error {
	_, err := r.db.Exec(`DELETE FROM users WHERE id = $1`, id)
	return err
}

func (r *UserRepository) StoreGoogleToken(userID, accessToken, refreshToken string, expiry time.Time) error {
	_, err := r.db.Exec(`
		INSERT INTO google_tokens (user_id, access_token, refresh_token, token_expiry)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE
		  SET access_token  = EXCLUDED.access_token,
		      refresh_token = EXCLUDED.refresh_token,
		      token_expiry  = EXCLUDED.token_expiry`,
		userID, accessToken, refreshToken, expiry,
	)
	return err
}

type GoogleToken struct {
	UserID       string
	AccessToken  string
	RefreshToken string
	Expiry       time.Time
}

func (r *UserRepository) GetGoogleToken(userID string) (*GoogleToken, error) {
	t := &GoogleToken{}
	err := r.db.QueryRow(
		`SELECT user_id, access_token, refresh_token, token_expiry FROM google_tokens WHERE user_id = $1`,
		userID,
	).Scan(&t.UserID, &t.AccessToken, &t.RefreshToken, &t.Expiry)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return t, err
}
