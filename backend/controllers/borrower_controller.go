package controllers

import (
	"net/http"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetBorrowers - Get all borrowers
func GetBorrowers(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var borrowers []models.Borrower

	search := c.Query("search")
	query := db

	if search != "" {
		query = query.Where("name LIKE ? OR identity_no LIKE ? OR phone LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	query.Order("created_at DESC").Find(&borrowers)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   borrowers,
		"count":  len(borrowers),
	})
}

// GetBorrower - Get single borrower with transaction history
func GetBorrower(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var borrower models.Borrower
	if err := db.First(&borrower, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Peminjam tidak ditemukan",
		})
		return
	}

	// Get transaction history
	var transactions []models.Transaction
	db.Preload("Item").Where("borrower_id = ?", id).Order("created_at DESC").Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"borrower":     borrower,
			"transactions": transactions,
		},
	})
}
