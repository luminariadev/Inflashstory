package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"inventory-api/models"
	"inventory-api/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CreateBooking - User membuat booking (fitur lanjutan)
func CreateBooking(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var req models.BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Cek item available
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
			"message": "Item sedang tidak tersedia untuk booking",
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

	// ✅ FIX: Parse date dan gunakan untuk validasi
	estReturnDate, err := utils.ParseDate(req.EstReturnDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Format tanggal tidak valid (YYYY-MM-DD)",
		})
		return
	}

	// Parse start date jika ada, default ke time.Now()
	startDate := time.Now()
	if req.StartDateStr != "" {
		parsedStart, err := utils.ParseDate(req.StartDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Format tanggal tidak valid",
			})
			return
		}
		startDate = parsedStart
	}

	// ✅ Validasi tanggal tidak boleh kurang dari hari ini
	if estReturnDate.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Tanggal pengembalian tidak boleh kurang dari hari ini",
		})
		return
	}

	// Create booking with expiry 24 hours
	booking := models.Booking{
		BookingCode: utils.GenerateBookingCode(),
		ItemID:      item.ID,
		BorrowerID:  borrower.ID,
		Purpose:     req.Purpose,
		BookingDate: time.Now(),
		StartDate:   startDate, // ✅ Added start_date mapping
		ExpiryDate:  startDate.Add(24 * time.Hour), // Expire dari start_date
		Status:      "pending",
		Notes:       req.Notes,
		SuratURL:    req.SuratURL, // ✅ FST INTEGRATION: Map document URL
		KtpURL:      req.KtpURL,   // ✅ FST INTEGRATION: Map document URL
	}

	if err := db.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat booking: " + err.Error(),
		})
		return
	}

	// Reload booking dengan relasi
	db.Preload("Item").Preload("Borrower").First(&booking, booking.ID)

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Booking berhasil dibuat. Silakan datang ke jurusan dalam 1x24 jam untuk konfirmasi.",
		"data":    booking,
	})
}

// GetBookings - Get all bookings (admin)
func GetBookings(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var bookings []models.Booking

	status := c.Query("status")
	query := db.Preload("Item").Preload("Borrower")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Order("created_at DESC").Find(&bookings)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   bookings,
		"count":  len(bookings),
	})
}

// GetBookingByID - Get single booking
func GetBookingByID(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var booking models.Booking
	if err := db.Preload("Item").Preload("Borrower").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Booking tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   booking,
	})
}

// ApproveBooking - Admin approve/reject booking
func ApproveBooking(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var booking models.Booking
	if err := db.Preload("Item").Preload("Borrower").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Booking tidak ditemukan",
		})
		return
	}

	var req models.ApproveBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Validasi status
	if req.Status != "approved" && req.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Status harus 'approved' atau 'rejected'",
		})
		return
	}

	// Check expiry
	if booking.ExpiryDate.Before(time.Now()) && booking.Status == "pending" {
		booking.Status = "expired"
		db.Save(&booking)
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Booking sudah expired",
		})
		return
	}

	// Fix N4: Gunakan db.Transaction untuk mencegah race condition (TOCTOU)
	err := db.Transaction(func(tx *gorm.DB) error {
		// Jika approved, re-check status item dengan lock UPDATE
		if req.Status == "approved" {
			var item models.Item
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&item, booking.ItemID).Error; err != nil {
				return errors.New("item tidak ditemukan")
			}

			if item.Status != "available" {
				return errors.New("overlap: item sudah dipinjam atau tidak tersedia")
			}

			// Update item status
			item.Status = "borrowed"
			item.UpdatedAt = time.Now()
			if err := tx.Save(&item).Error; err != nil {
				return err
			}
		}

		// Update booking
		booking.Status = req.Status
		if req.Notes != "" {
			booking.Notes = req.Notes
		}

		now := time.Now()
		booking.ApprovedAt = &now
		booking.UpdatedAt = time.Now()
		
		// ✅ FIX N11: Set ApprovedBy dari context admin_username
		adminUsername := c.GetString("admin_username")
		if adminUsername != "" {
			var admin models.Admin
			if err := tx.Where("username = ?", adminUsername).First(&admin).Error; err == nil {
				booking.ApprovedBy = admin.ID
			}
		}

		if err := tx.Save(&booking).Error; err != nil {
			return err
		}

		// If approved, create transaction automatically
		if req.Status == "approved" {
			transaction := models.Transaction{
				TransactionCode: utils.GenerateTransactionCode(),
				ItemID:          booking.ItemID,
				BorrowerID:      booking.BorrowerID,
				Purpose:         booking.Purpose,
				BorrowDate:      time.Now(),
				EstReturnDate:   booking.ExpiryDate,
				Status:          "borrowed",
				Notes:           "Dari booking: " + booking.BookingCode,
				IsManual:        false,
			}
			if err := tx.Create(&transaction).Error; err != nil {
				return err
			}
		}
		
		return nil
	})

	if err != nil {
		if err.Error() == "overlap: item sudah dipinjam atau tidak tersedia" {
			c.JSON(http.StatusConflict, gin.H{
				"status":  "error",
				"message": "Gagal menyetujui: Barang sudah dipinjam oleh pihak lain.",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memproses booking: " + err.Error(),
		})
		return
	}

	// ✅ CLEAN UP STORAGE: Jika ditolak, hapus file dokumen secara fisik (di luar DB transaction)
	if req.Status == "rejected" {
		utils.DeleteDocumentFiles(booking.SuratURL, booking.KtpURL)
	}

	// Reload booking
	db.Preload("Item").Preload("Borrower").First(&booking, booking.ID)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Booking berhasil " + req.Status,
		"data":    booking,
	})
}

// CancelBooking - Cancel booking (by user)
func CancelBooking(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var booking models.Booking
	if err := db.Preload("Borrower").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Booking tidak ditemukan",
		})
		return
	}

	// Validasi UserID (dari token) == BorrowerID pemilik transaksi
	userID := c.GetString("user_id")
	borrowerIDStr := fmt.Sprintf("%d", booking.BorrowerID)
	
	if userID != borrowerIDStr && userID != booking.Borrower.IdentityNo {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "Forbidden: Anda tidak memiliki akses untuk membatalkan booking ini",
		})
		return
	}

	if booking.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Hanya booking dengan status pending yang bisa dibatalkan",
		})
		return
	}

	booking.Status = "cancelled"
	booking.UpdatedAt = time.Now()
	db.Save(&booking)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Booking berhasil dibatalkan",
		"data":    booking,
	})
}

// CheckExpiredBookings - Check and update expired bookings (dipanggil cron/job scheduler)
func CheckExpiredBookings(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	result := db.Model(&models.Booking{}).
		Where("status = ? AND expiry_date < ?", "pending", time.Now()).
		Update("status", "expired")

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Expired bookings updated",
		"count":   result.RowsAffected,
	})
}
