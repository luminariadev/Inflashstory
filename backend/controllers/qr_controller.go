package controllers

import (
	"net/http"
	"os"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

// GetQR - Generate QR code untuk item (berisi URL form peminjaman)
func GetQR(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var item models.Item
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	// Tambahkan package "os" di bagian atas file (di dalam import) jika belum ada

	// Ambil Base URL Frontend dari environment variable (misal dari Ngrok atau IP lokal)
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		// Fallback ke localhost kalau variabel environment-nya kosong
		baseURL = "http://localhost:5173"
	}

	// QR Code berisi URL lengkap ke form peminjaman frontend
	qrURL := baseURL + "/borrow?item_id=" + id

	qr, err := qrcode.New(qrURL, qrcode.Medium)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal generate QR: " + err.Error(),
		})
		return
	}

	png, err := qr.PNG(256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal generate PNG: " + err.Error(),
		})
		return
	}

	c.Header("Content-Type", "image/png")
	c.Data(http.StatusOK, "image/png", png)
}

// GetQRInfo - Get item info for QR (alternatif JSON)
func GetQRInfo(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var item models.Item
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"id":          item.ID,
			"name":        item.Name,
			"code":        item.Code,
			"status":      item.Status,
			"location":    item.Location,
			"description": item.Description,
		},
	})
}
