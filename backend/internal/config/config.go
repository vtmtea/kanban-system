package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	ServerPort string
	JWTSecret  string
	JWTExpiry  time.Duration
}

var AppConfig *Config

func LoadConfig() *Config {
	godotenv.Load()

	expiryStr := getEnv("JWT_EXPIRY", "24h")
	expiry, _ := time.ParseDuration(expiryStr)

	config := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "kanban"),
		DBPassword: getEnv("DB_PASSWORD", "kanban123"),
		DBName:     getEnv("DB_NAME", "kanban"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpiry:  expiry,
	}

	AppConfig = config
	return config
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}