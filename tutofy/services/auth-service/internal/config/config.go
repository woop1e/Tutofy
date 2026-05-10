package config

import (
	"log"
	"os"

	"github.com/joho/godotenv" // Импортируем библиотеку
)

type Config struct {
	DBURL     string
	JWTSecret string
	Port      string
	RedisAddr string
}

func Load() *Config {
	// Загружаем файл .env. Если его нет, просто идем дальше
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	return &Config{
		DBURL:     os.Getenv("DB_URL"),
		JWTSecret: os.Getenv("JWT_SECRET"),
		Port:      port,
		RedisAddr: redisAddr,
	}
}
