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
	ProgressServiceAddr   string
	EnrollmentServiceAddr string
}

func Load() *Config {
	_ = godotenv.Load()
	port := os.Getenv("PORT")
	if port == "" {
		port = "50065"
	}
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required")
	}
	return &Config{
		DBURL:                 dbURL,
		Port:                  port,
		AuthServiceAddr:       env("AUTH_SERVICE_ADDR", "localhost:50051"),
		ProgressServiceAddr:   env("PROGRESS_SERVICE_ADDR", "localhost:50058"),
		EnrollmentServiceAddr: env("ENROLLMENT_SERVICE_ADDR", "localhost:50054"),
	}
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
