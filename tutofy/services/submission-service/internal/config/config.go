package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBURL                 string
	Port                  string
	AuthServiceAddr       string
	AssignmentServiceAddr string
	EnrollmentServiceAddr string
}

func Load() *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "50063"
	}
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required")
	}
	return &Config{
		DBURL:                 dbURL,
		Port:                  port,
		AuthServiceAddr:       env("AUTH_SERVICE_ADDR", "localhost:50051"),
		AssignmentServiceAddr: env("ASSIGNMENT_SERVICE_ADDR", "localhost:50059"),
		EnrollmentServiceAddr: env("ENROLLMENT_SERVICE_ADDR", "localhost:50054"),
	}
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
