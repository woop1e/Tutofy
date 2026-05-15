package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	AuthServiceAddr       string
	UserServiceAddr       string
	CourseServiceAddr     string
	EnrollmentServiceAddr string
	LessonServiceAddr     string
	AssignmentServiceAddr string
	GradingServiceAddr    string
	NotificationSvcAddr   string
	ProgressServiceAddr   string
	PaymentServiceAddr    string
	MessagingServiceAddr  string
	MediaServiceAddr      string
	ReviewServiceAddr     string
	SubmissionServiceAddr string
	QuizServiceAddr       string
}

func Load() *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:                  port,
		AuthServiceAddr:       env("AUTH_SERVICE_ADDR", "localhost:50051"),
		UserServiceAddr:       env("USER_SERVICE_ADDR", "localhost:50052"),
		CourseServiceAddr:     env("COURSE_SERVICE_ADDR", "localhost:50053"),
		EnrollmentServiceAddr: env("ENROLLMENT_SERVICE_ADDR", "localhost:50054"),
		LessonServiceAddr:     env("LESSON_SERVICE_ADDR", "localhost:50055"),
		AssignmentServiceAddr: env("ASSIGNMENT_SERVICE_ADDR", "localhost:50059"),
		GradingServiceAddr:    env("GRADING_SERVICE_ADDR", "localhost:50056"),
		NotificationSvcAddr:   env("NOTIFICATION_SERVICE_ADDR", "localhost:50057"),
		ProgressServiceAddr:   env("PROGRESS_SERVICE_ADDR", "localhost:50058"),
		PaymentServiceAddr:    env("PAYMENT_SERVICE_ADDR", "localhost:50061"),
		MessagingServiceAddr:  env("MESSAGING_SERVICE_ADDR", "localhost:50060"),
		MediaServiceAddr:      env("MEDIA_SERVICE_ADDR", "localhost:50062"),
		ReviewServiceAddr:     env("REVIEW_SERVICE_ADDR", "localhost:50065"),
		SubmissionServiceAddr: env("SUBMISSION_SERVICE_ADDR", "localhost:50063"),
		QuizServiceAddr:       env("QUIZ_SERVICE_ADDR", "localhost:50064"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	log.Printf("config: %s not set, using default %s", key, fallback)
	return fallback
}
