package controllers

import (
	"net/http"
	"time"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginAdmin - Admin login
func LoginAdmin(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	var admin models.Admin
	if err := db.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Username atau password salah",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Username atau password salah",
		})
		return
	}

	now := time.Now()
	admin.LastLogin = &now
	db.Save(&admin)

	// Return admin data without password
	admin.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Login berhasil",
		"data":    admin,
		"token":   "admin-secret-key", // Sementara, nanti ganti JWT
	})
}

// GetAdminProfile - Get admin profile
func GetAdminProfile(c *gin.Context) {
	// Get admin ID from context (after auth)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"username": "admin",
			"name":     "Administrator",
			"role":     "superadmin",
		},
	})
}
