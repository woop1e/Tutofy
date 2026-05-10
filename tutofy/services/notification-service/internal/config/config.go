package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration for the notification service.
type Config struct {
	DBURL           string
	Port            string
	AuthServiceAddr string
}

// Load reads configuration from a .env file (if present) and environment variables.
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "50057"
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required")
	}

	authAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authAddr == "" {
		authAddr = "localhost:50051"
	}

	return &Config{
		DBURL:           dbURL,
		Port:            port,
		AuthServiceAddr: authAddr,
	}
}
