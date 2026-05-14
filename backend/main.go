package main

import (
	"log"
	"time"

	"inventory-api/config"
	"inventory-api/middleware"
	"inventory-api/models"
	"inventory-api/routes"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	config.InitDB()
}

func migrateDatabase() {
	db := config.GetDB()

	err := db.AutoMigrate(
		&models.Item{},
		&models.Borrower{},
		&models.Transaction{},
		&models.Booking{},
		&models.Admin{},
	)
	if err != nil {
		log.Fatal("❌ Gagal migrate database:", err)
	}
	log.Println("✅ Database migrated!")
}

func seedDatabase() {
	db := config.GetDB()

	// Seed Items dengan CreatedAt yang valid
	var itemCount int64
	db.Model(&models.Item{}).Count(&itemCount)
	if itemCount == 0 {
		now := time.Now()
		items := []models.Item{
			{Name: "Laptop Dell XPS", Code: "IT-001", Category: "Elektronik", Location: "Lab A", Status: "available", Condition: "good", Description: "Laptop untuk presentasi", ImageURL: "", CreatedAt: now, UpdatedAt: now},
			{Name: "Proyektor Epson", Code: "IT-002", Category: "Elektronik", Location: "Ruang Rapat", Status: "available", Condition: "good", Description: "Proyektor 3000 lumens", ImageURL: "", CreatedAt: now, UpdatedAt: now},
			{Name: "Kabel HDMI 2m", Code: "IT-003", Category: "Aksesoris", Location: "Lab A", Status: "available", Condition: "good", Description: "Kabel HDMI panjang 2 meter", ImageURL: "", CreatedAt: now, UpdatedAt: now},
			{Name: "Kamera DSLR", Code: "IT-004", Category: "Elektronik", Location: "Ruang Media", Status: "available", Condition: "fair", Description: "Kamera untuk dokumentasi", ImageURL: "", CreatedAt: now, UpdatedAt: now},
			{Name: "Tripod Kamera", Code: "IT-005", Category: "Aksesoris", Location: "Ruang Media", Status: "available", Condition: "good", Description: "Tripod aluminium", ImageURL: "", CreatedAt: now, UpdatedAt: now},
			{Name: "Whiteboard", Code: "IT-006", Category: "Alat Tulis", Location: "Ruang Kelas", Status: "available", Condition: "good", Description: "Whiteboard 90x120cm", ImageURL: "", CreatedAt: now, UpdatedAt: now},
		}
		for _, item := range items {
			db.Create(&item)
		}
		log.Println("✅ Seed items completed!")
	}

	// Seed Admin default
	var adminCount int64
	db.Model(&models.Admin{}).Count(&adminCount)
	if adminCount == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin := models.Admin{
			Username:  "admin",
			Password:  string(hashedPassword),
			Email:     "admin@inflashstory.com",
			Name:      "Administrator",
			Role:      "superadmin",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		db.Create(&admin)
		log.Println("✅ Default admin created! Username: admin, Password: admin123")
	}
}

func main() {
	migrateDatabase()
	seedDatabase()

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORS())
	r.Use(middleware.DatabaseMiddleware(config.GetDB()))

	// Routes
	routes.SetupRoutes(r)

	log.Println("🚀 Server running on http://localhost:8080")
	log.Println("📋 API endpoints:")
	log.Println("   Public:")
	log.Println("     GET  /api/items")
	log.Println("     POST /api/borrow/:id  (scan QR - otomatis)")
	log.Println("   Admin (Header: X-Admin-Token: admin-secret-key):")
	log.Println("     POST /api/admin/login")
	log.Println("     POST /api/admin/borrow/manual")
	log.Println("     POST /api/admin/return/:id")
	log.Println("     GET  /api/admin/transactions")
	log.Println("     GET  /api/admin/borrowers")

	if err := r.Run(":8080"); err != nil {
		log.Fatal("❌ Gagal start server:", err)
	}
}
