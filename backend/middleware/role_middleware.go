package middleware

import (
	"net/http"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RequireSuperAdmin middleware untuk membatasi akses khusus Super_Admin
func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		adminUsername := c.GetHeader("X-Admin-Username")

		if adminUsername == "" {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Akses ditolak. Header X-Admin-Username tidak ditemukan.",
			})
			c.Abort()
			return
		}

		var admin models.Admin
		if err := db.Where("username = ?", adminUsername).First(&admin).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Akses ditolak. Admin tidak valid.",
			})
			c.Abort()
			return
		}

		if admin.Role != "Super_Admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Akses ditolak. Hanya Super Admin yang dapat melakukan aksi ini.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
