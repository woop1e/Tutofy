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
	NATSAddr              string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "50056"
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is required")
	}

	authAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authAddr == "" {
		authAddr = "localhost:50051"
	}

	assignmentAddr := os.Getenv("ASSIGNMENT_SERVICE_ADDR")
	if assignmentAddr == "" {
		assignmentAddr = "localhost:50059"
	}

	enrollmentAddr := os.Getenv("ENROLLMENT_SERVICE_ADDR")
	if enrollmentAddr == "" {
		enrollmentAddr = "localhost:50054"
	}

	natsAddr := os.Getenv("NATS_ADDR")
	if natsAddr == "" {
		natsAddr = "nats://localhost:4222"
	}

	return &Config{
		DBURL:                 dbURL,
		Port:                  port,
		AuthServiceAddr:       authAddr,
		AssignmentServiceAddr: assignmentAddr,
		EnrollmentServiceAddr: enrollmentAddr,
		NATSAddr:              natsAddr,
	}
}
