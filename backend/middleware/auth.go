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

		// Untuk development: token = "admin-secret-key"
		if token != "admin-secret-key" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Unauthorized access",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
