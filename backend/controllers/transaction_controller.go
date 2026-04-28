package controllers

import (
	"net/http"
	"time"

	"inventory-api/models"
	"inventory-api/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BorrowItem - Mahasiswa scan QR, isi form, submit (OTOMATIS)
func BorrowItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	itemID := c.Param("id")

	// Cek item exists dan available
	var item models.Item
	if err := db.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	if item.Status != "available" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Item sedang tidak tersedia (status: " + item.Status + ")",
		})
		return
	}

	// Parse request
	var req models.BorrowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak lengkap: " + err.Error(),
		})
		return
	}

	// Parse date
	estReturnDate, err := utils.ParseDate(req.EstReturnDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Format tanggal pengembalian tidak valid (YYYY-MM-DD)",
		})
		return
	}

	// Find or create borrower
	var borrower models.Borrower
	result := db.Where("identity_no = ?", req.IdentityNo).First(&borrower)
	if result.Error != nil {
		borrower = models.Borrower{
			Name:         req.BorrowerName,
			IdentityNo:   req.IdentityNo,
			StudyProgram: req.StudyProgram,
			Class:        req.Class,
			Phone:        req.Phone,
			Email:        req.Email,
		}
		if err := db.Create(&borrower).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menyimpan data peminjam: " + err.Error(),
			})
			return
		}
	}

	// Create transaction (otomatis, is_manual = false)
	transaction := models.Transaction{
		TransactionCode: utils.GenerateTransactionCode(),
		ItemID:          item.ID,
		BorrowerID:      borrower.ID,
		Purpose:         req.Purpose,
		BorrowDate:      time.Now(),
		EstReturnDate:   estReturnDate,
		Status:          "borrowed",
		Notes:           req.Notes,
		IsManual:        false, // Otomatis dari scan QR
	}

	if err := db.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mencatat peminjaman: " + err.Error(),
		})
		return
	}

	// Reload transaction dengan Preload
	db.Preload("Item").Preload("Borrower").First(&transaction, transaction.ID)

	// Update item status
	item.Status = "borrowed"
	item.UpdatedAt = time.Now()
	db.Save(&item)

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Barang berhasil dipinjam! Silakan ambil barang ke petugas.",
		"transaction": transaction,
		"item":        item,
	})
}

// ManualBorrowItem - Admin input manual (BACKUP jika sistem error)
func ManualBorrowItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var req models.ManualBorrowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Cek item exists dan available
	var item models.Item
	if err := db.First(&item, req.ItemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	if item.Status != "available" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Item sedang tidak tersedia",
		})
		return
	}

	// Parse date
	estReturnDate, err := utils.ParseDate(req.EstReturnDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Format tanggal tidak valid",
		})
		return
	}

	// Find or create borrower
	var borrower models.Borrower
	result := db.Where("identity_no = ?", req.IdentityNo).First(&borrower)
	if result.Error != nil {
		borrower = models.Borrower{
			Name:         req.BorrowerName,
			IdentityNo:   req.IdentityNo,
			StudyProgram: req.StudyProgram,
			Class:        req.Class,
			Phone:        req.Phone,
			Email:        req.Email,
		}
		db.Create(&borrower)
	}

	// Create transaction (manual, is_manual = true)
	transaction := models.Transaction{
		TransactionCode: utils.GenerateTransactionCode(),
		ItemID:          item.ID,
		BorrowerID:      borrower.ID,
		Purpose:         req.Purpose,
		BorrowDate:      time.Now(),
		EstReturnDate:   estReturnDate,
		Status:          "borrowed",
		Notes:           req.Notes,
		IsManual:        true, // Input manual admin
	}

	db.Create(&transaction)
	db.Preload("Item").Preload("Borrower").First(&transaction, transaction.ID)

	item.Status = "borrowed"
	db.Save(&item)

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Peminjaman berhasil dicatat (manual admin)",
		"transaction": transaction,
	})
}

// ReturnItem - Kembalikan barang
func ReturnItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	transactionID := c.Param("id")

	var transaction models.Transaction
	if err := db.Preload("Item").Preload("Borrower").First(&transaction, transactionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Transaksi tidak ditemukan",
		})
		return
	}

	if transaction.Status == "returned" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Barang sudah dikembalikan",
		})
		return
	}

	var req models.ReturnRequest
	c.ShouldBindJSON(&req)

	now := time.Now()
	transaction.ActualReturnDate = &now
	transaction.Status = "returned"
	if req.Notes != "" {
		transaction.Notes = req.Notes
	}
	transaction.UpdatedAt = time.Now()

	db.Save(&transaction)

	// Update item status
	var item models.Item
	db.First(&item, transaction.ItemID)
	item.Status = "available"
	item.UpdatedAt = time.Now()
	db.Save(&item)

	// Reload transaction
	db.Preload("Item").Preload("Borrower").First(&transaction, transaction.ID)

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Barang berhasil dikembalikan",
		"transaction": transaction,
	})
}

// GetTransactions - Get all transactions
func GetTransactions(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var transactions []models.Transaction

	status := c.Query("status")
	query := db.Preload("Item").Preload("Borrower")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Order("created_at DESC").Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   transactions,
		"count":  len(transactions),
	})
}

// GetActiveTransactions - Get active borrowings
func GetActiveTransactions(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var transactions []models.Transaction

	db.Preload("Item").Preload("Borrower").
		Where("status = ?", "borrowed").
		Order("est_return_date ASC").
		Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   transactions,
		"count":  len(transactions),
	})
}

// GetTransactionByID - Get single transaction
func GetTransactionByID(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var transaction models.Transaction
	if err := db.Preload("Item").Preload("Borrower").First(&transaction, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Transaksi tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   transaction,
	})
}

// GetOverdueTransactions - Get overdue transactions
func GetOverdueTransactions(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var transactions []models.Transaction

	db.Preload("Item").Preload("Borrower").
		Where("status = ? AND est_return_date < ?", "borrowed", time.Now()).
		Order("est_return_date ASC").
		Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   transactions,
		"count":  len(transactions),
	})
}
