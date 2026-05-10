package service

import (
	"auth-service/internal/model"
	"auth-service/internal/repository"
	"context"
	"errors"
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
}

func NewAuthService(repo *repository.UserRepository, jwtSecret string, rdb *redis.Client) *AuthService {
	return &AuthService{repo: repo, jwtSecret: jwtSecret, rdb: rdb}
}

func (s *AuthService) Register(email, password, name, role string) (string, error) {
	existing, err := s.repo.GetUserByEmail(email)
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
		ID:       uuid.NewString(),
		Email:    email,
		Password: string(hashed),
		Name:     name,
		Role:     role,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return "", err
	}

	return s.GenerateJWT(user.ID, user.Role)
}

func (s *AuthService) Login(email, password string) (string, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	return s.GenerateJWT(user.ID, user.Role)
}

func (s *AuthService) GenerateJWT(userID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) ValidateJWT(tokenStr string) (string, string, error) {
	// Cache hit — skip JWT parsing on hot path.
	if s.rdb != nil {
		if val, err := s.rdb.Get(context.Background(), "token:"+tokenStr).Result(); err == nil {
			if parts := strings.SplitN(val, ":", 2); len(parts) == 2 {
				return parts[0], parts[1], nil
			}
		}
	}

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
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
