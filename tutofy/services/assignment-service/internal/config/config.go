package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBURL             string
	Port              string
	AuthServiceAddr   string
	CourseServiceAddr string
}

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

	courseAddr := os.Getenv("COURSE_SERVICE_ADDR")
	if courseAddr == "" {
		courseAddr = "localhost:50053"
	}

	return &Config{
		DBURL:             dbURL,
		Port:              port,
		AuthServiceAddr:   authAddr,
		CourseServiceAddr: courseAddr,
	}
}
