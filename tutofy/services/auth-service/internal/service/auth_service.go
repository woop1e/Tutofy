package service

import (
	"auth-service/internal/email"
	"auth-service/internal/model"
	"auth-service/internal/repository"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo      *repository.UserRepository
	jwtSecret string
	rdb       *redis.Client
	mailer    *email.Mailer
	appURL    string
}

func NewAuthService(repo *repository.UserRepository, jwtSecret string, rdb *redis.Client, mailer *email.Mailer, appURL string) *AuthService {
	return &AuthService{repo: repo, jwtSecret: jwtSecret, rdb: rdb, mailer: mailer, appURL: appURL}
}

// Register creates the account and sends a verification email.
// Returns a short-lived setup JWT (for api-gateway internal use only) and needs_verification=true.
// The api-gateway must NOT forward the token to the client.
func (s *AuthService) Register(email_, password, name, role string) (setupToken string, err error) {
	existing, err := s.repo.GetUserByEmail(email_)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return "", errors.New("user already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	user := &model.User{
		ID:            uuid.NewString(),
		Email:         email_,
		Password:      string(hashed),
		Name:          name,
		Role:          role,
		EmailVerified: false,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return "", err
	}

	if err := s.sendVerificationEmail(user.ID, email_); err != nil {
		_ = err
	}

	return s.GenerateJWT(user.ID, user.Role)
}

func (s *AuthService) sendVerificationEmail(userID, to string) error {
	token := uuid.NewString()
	if s.rdb != nil {
		if err := s.rdb.SetEx(context.Background(), "verify:"+token, userID, 24*time.Hour).Err(); err != nil {
			return err
		}
	}
	link := fmt.Sprintf("%s/verify-email?token=%s", s.appURL, token)
	body := fmt.Sprintf("Hello!\n\nPlease verify your email address by clicking the link below:\n\n%s\n\nThe link expires in 24 hours.\n\nIf you did not create an account on Tutofy, please ignore this email.", link)
	return s.mailer.SendEmail(to, "Verify your Tutofy account", body)
}

func (s *AuthService) VerifyEmail(token string) (string, error) {
	if s.rdb == nil {
		return "", errors.New("verification not available")
	}
	userID, err := s.rdb.Get(context.Background(), "verify:"+token).Result()
	if err != nil {
		return "", errors.New("invalid or expired verification link")
	}

	user, err := s.repo.GetUserByID(userID)
	if err != nil || user == nil {
		return "", errors.New("user not found")
	}

	if err := s.repo.SetEmailVerified(userID); err != nil {
		return "", err
	}

	_ = s.rdb.Del(context.Background(), "verify:"+token).Err()

	return s.GenerateJWT(user.ID, user.Role)
}

func (s *AuthService) DeleteUser(userID string) error {
	if s.rdb != nil {
		_ = s.rdb.Del(context.Background(), "user:"+userID).Err()
	}
	return s.repo.DeleteUser(userID)
}

func (s *AuthService) ResendVerification(email_ string) error {
	user, err := s.repo.GetUserByEmail(email_)
	if err != nil {
		return err
	}
	if user == nil {
		return nil // don't reveal whether email exists
	}
	if user.EmailVerified {
		return nil
	}
	return s.sendVerificationEmail(user.ID, user.Email)
}

func (s *AuthService) Login(email_, password string) (string, error) {
	user, err := s.repo.GetUserByEmail(email_)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	if !user.EmailVerified {
		return "", errors.New("email not verified")
	}

	return s.GenerateJWT(user.ID, user.Role)
}

func (s *AuthService) GenerateJWT(userID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) ValidateJWT(tokenStr string) (string, string, error) {
	if s.rdb != nil {
		if val, err := s.rdb.Get(context.Background(), "token:"+tokenStr).Result(); err == nil {
			if parts := strings.SplitN(val, ":", 2); len(parts) == 2 {
				return parts[0], parts[1], nil
			}
		}
	}

	t, err := jwt.Parse(tokenStr, func(tok *jwt.Token) (interface{}, error) {
		if _, ok := tok.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !t.Valid {
		return "", "", errors.New("invalid token")
	}

	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", errors.New("invalid claims")
	}

	userID, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)

	if s.rdb != nil {
		_ = s.rdb.SetEx(context.Background(), "token:"+tokenStr, userID+":"+role, 5*time.Minute).Err()
	}

	return userID, role, nil
}
