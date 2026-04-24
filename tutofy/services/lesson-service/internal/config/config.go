package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration for the lesson service.
type Config struct {
	DBURL             string
	Port              string
	AuthServiceAddr   string
	EnrollmentSvcAddr string
	ProgressSvcAddr   string
}

// Load reads configuration from a .env file (if present) and environment variables.
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "50055"
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required")
	}

	authAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authAddr == "" {
		authAddr = "localhost:50051"
	}

	enrollmentAddr := os.Getenv("ENROLLMENT_SERVICE_ADDR")
	if enrollmentAddr == "" {
		enrollmentAddr = "localhost:50052"
	}

	progressAddr := os.Getenv("PROGRESS_SERVICE_ADDR")
	if progressAddr == "" {
		progressAddr = "localhost:50054"
	}

	return &Config{
		DBURL:             dbURL,
		Port:              port,
		AuthServiceAddr:   authAddr,
		EnrollmentSvcAddr: enrollmentAddr,
		ProgressSvcAddr:   progressAddr,
	}
}
