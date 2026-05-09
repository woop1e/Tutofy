package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration for the media service.
type Config struct {
	DBURL             string
	Port              string
	AuthServiceAddr   string
	EnrollmentSvcAddr string

	// S3 / MinIO settings
	S3Endpoint        string // leave empty for real AWS S3
	S3AccessKeyID     string
	S3SecretAccessKey string
	S3Bucket          string
	S3Region          string
}

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

	s3Bucket := os.Getenv("S3_BUCKET")
	if s3Bucket == "" {
		log.Fatal("S3_BUCKET is required")
	}

	s3Region := os.Getenv("S3_REGION")
	if s3Region == "" {
		s3Region = "us-east-1" // default for MinIO
	}

	authAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authAddr == "" {
		authAddr = "localhost:50051"
	}

	enrollmentAddr := os.Getenv("ENROLLMENT_SERVICE_ADDR")
	if enrollmentAddr == "" {
		enrollmentAddr = "localhost:50052"
	}

	return &Config{
		DBURL:             dbURL,
		Port:              port,
		AuthServiceAddr:   authAddr,
		EnrollmentSvcAddr: enrollmentAddr,
		S3Endpoint:        os.Getenv("S3_ENDPOINT"), // e.g. http://localhost:9000 for MinIO
		S3AccessKeyID:     os.Getenv("S3_ACCESS_KEY_ID"),
		S3SecretAccessKey: os.Getenv("S3_SECRET_ACCESS_KEY"),
		S3Bucket:          s3Bucket,
		S3Region:          s3Region,
	}
}
