package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type uploadRateWindow struct {
	count     int
	expiresAt time.Time
}

var (
	uploadRateMu      sync.Mutex
	uploadRateWindows = map[string]uploadRateWindow{}
)

func UploadRateLimit() gin.HandlerFunc {
	const maxUploads = 20
	windowDuration := 10 * time.Minute

	return func(c *gin.Context) {
		now := time.Now()
		clientIP := c.ClientIP()

		uploadRateMu.Lock()
		window := uploadRateWindows[clientIP]
		if now.After(window.expiresAt) {
			window = uploadRateWindow{expiresAt: now.Add(windowDuration)}
		}
		window.count++
		uploadRateWindows[clientIP] = window

		for ip, candidate := range uploadRateWindows {
			if now.After(candidate.expiresAt) {
				delete(uploadRateWindows, ip)
			}
		}
		uploadRateMu.Unlock()

		if window.count > maxUploads {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak upload. Coba lagi beberapa menit lagi.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
