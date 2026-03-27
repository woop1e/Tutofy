package config

import (
	"os"

	"github.com/joho/godotenv" // 1. Добавляем импорт
)

type Config struct {
	DBURL           string
	Port            string
	AuthServiceAddr string
}

func Load() *Config {
	// 2. Загружаем .env перед чтением переменных
	// Если файла нет (например, в Docker-контейнере),
	// Load просто пропустит этот шаг и будет искать в системе.
	_ = godotenv.Load()

	cfg := &Config{
		DBURL:           getEnv("DB_URL", ""),
		Port:            getEnv("PORT", "50052"),
		AuthServiceAddr: getEnv("AUTH_SERVICE_ADDR", "localhost:50051"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
