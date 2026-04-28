package controllers

import (
	"encoding/json"
	"net/http"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

// GetQR - Generate QR code for item
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

	// QR content berisi URL frontend untuk form peminjaman
	qrContent := map[string]interface{}{
		"type":      "borrow_form",
		"item_id":   item.ID,
		"item_name": item.Name,
		"item_code": item.Code,
		"url":       "http://localhost:5173/borrow-form?item_id=" + id,
	}

	// ✅ FIX: Convert to JSON manually
	jsonBytes, err := json.Marshal(qrContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat konten QR: " + err.Error(),
		})
		return
	}

	qr, err := qrcode.New(string(jsonBytes), qrcode.Medium)
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
