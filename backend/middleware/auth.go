package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SimpleAuth middleware untuk admin routes
// Nanti bisa diganti dengan JWT
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Sementara: pake header X-Admin-Token
		token := c.GetHeader("X-Admin-Token")
		adminUsername := c.GetHeader("X-Admin-Username")

		// Untuk development: token = "admin-secret-key"
		if token != "admin-secret-key" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Unauthorized access",
			})
			c.Abort()
			return
		}

		if adminUsername != "" {
			c.Set("admin_username", adminUsername)
		}
		c.Next()
	}
}

// UserAuth middleware untuk user routes (student)
func UserAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-User-Token") // Misal JWT token berisi ID/NIM
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Unauthorized access, token missing",
			})
			c.Abort()
			return
		}
		c.Set("user_id", token)
		c.Next()
	}
}
