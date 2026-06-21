package config

import (
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	driver := getEnv("DB_DRIVER", "sqlite")

	var dialector gorm.Dialector

	switch driver {
	case "mysql":
		host := getEnv("DB_HOST", "127.0.0.1")
		port := getEnv("DB_PORT", "3307")
		user := getEnv("DB_USER", "root")
		password := getEnv("DB_PASSWORD", "")
		dbname := getEnv("DB_NAME", "inflashstory")

		dsn := user + ":" + password + "@tcp(" + host + ":" + port + ")/" + dbname + "?charset=utf8mb4&parseTime=True&loc=Local"
		dialector = mysql.Open(dsn)
		log.Printf("âœ… Connecting to MySQL: %s:%s/%s", host, port, dbname)

	case "sqlite":
		fallthrough
	default:
		dbPath := getEnv("DB_PATH", "./inventory.db")
		dialector = sqlite.Open(dbPath)
		log.Printf("âœ… Connecting to SQLite: %s", dbPath)
	}

	var err error
	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatal("âŒ Gagal koneksi ke database:", err)
	}

	log.Println("âœ… Database connected!")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func GetDB() *gorm.DB {
	return DB
}

func CloseDB() {
	sqlDB, err := DB.DB()
	if err == nil {
		sqlDB.Close()
	}
}
