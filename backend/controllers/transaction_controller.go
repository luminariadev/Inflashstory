package controllers

import (
	// âœ… TAMBAHIN INI
	"errors"
	"net/http"
	"time"

	"inventory-api/models"
	"inventory-api/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BorrowItem - Mahasiswa scan QR atau Booking (Logic Traveloka Lite + Anti Race Condition)
func BorrowItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	itemID := c.Param("id")

	// 1. Parse Request JSON (Lakuin di luar antrean biar server gak berat)
	var req models.BorrowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Data tidak lengkap: " + err.Error()})
		return
	}

	// 2. Parsing DateTime format HTML5 datetime-local
	layout := "2006-01-02T15:04"
	loc := time.Local
	startDate, err := time.ParseInLocation(layout, req.StartDate, loc)
	if err != nil {
		startDate = time.Now()
	}

	estReturnDate, err := time.ParseInLocation(layout, req.EstReturnDateStr, loc)
	if err != nil {
		estReturnDate, err = time.Parse("2006-01-02", req.EstReturnDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Format waktu pengembalian tidak valid"})
			return
		}
	}

	// Variabel penampung hasil akhir untuk dikirim ke frontend
	var finalTransaction models.Transaction
	var finalItem models.Item

	// ðŸ”¥ 3. MULAI DATABASE TRANSACTION (SISTEM KARCIS ANTREAN)
	// Kalau ada 2 orang ngeklik barengan di milidetik yang sama, orang kedua disuruh nunggu di sini!
	err = db.Transaction(func(tx *gorm.DB) error {

		// A. Cek ketersediaan Item di dalam transaksi (Data dijamin paling update)
		if err := tx.First(&finalItem, itemID).Error; err != nil {
			return errors.New("Item tidak ditemukan")
		}

		if req.Type != "booking" && finalItem.Status != "available" {
			return errors.New("Item sedang tidak tersedia secara fisik saat ini!")
		}

		// B. LOGIC ANTI-BENTROK SAKTI (MULTI-STOK)
		var overlappingCount int64
		tx.Model(&models.Transaction{}).
			Where("item_id = ?", itemID).
			Where("status IN ?", []string{"pending", "approved", "borrowed"}).
			Where("borrow_date < ? AND est_return_date > ?", estReturnDate, startDate).
			Count(&overlappingCount)

		// âœ… BUKA GEMBOK: Bandingkan jumlah bentrokan dengan Total Stok
		if overlappingCount >= int64(finalItem.TotalStock) {
			return errors.New("Stok tidak mencukupi untuk waktu tersebut")
		}

		// C. Validasi Surat Pengantar & Jaminan ID
		if finalItem.RequireLetter && req.Attachment == "" {
			return errors.New("Surat peminjaman (PDF) wajib diunggah untuk barang ini!")
		}
		if finalItem.RequiredID == "ktm" && req.IdPhoto == "" {
			return errors.New("Foto KTM wajib diunggah!")
		} else if finalItem.RequiredID == "ktp" && req.IdPhoto == "" {
			return errors.New("Foto KTP wajib diunggah!")
		}

		// D. Upsert Data Borrower
		var borrower models.Borrower
		result := tx.Where("identity_no = ?", req.IdentityNo).First(&borrower)

		borrower.Name = req.BorrowerName
		borrower.StudyProgram = req.StudyProgram
		borrower.Class = req.Class
		borrower.Phone = req.Phone
		borrower.Email = req.Email
		borrower.UpdatedAt = time.Now()

		if finalItem.RequiredID == "ktm" {
			borrower.KTMPhoto = req.IdPhoto
		} else if finalItem.RequiredID == "ktp" {
			borrower.KTPPhoto = req.IdPhoto
		}

		if result.Error != nil {
			borrower.IdentityNo = req.IdentityNo
			borrower.CreatedAt = time.Now()
			tx.Create(&borrower)
		} else {
			tx.Save(&borrower)
		}

		// E. UPDATE STATUS ITEM FISIK (MULTI-STOK)
		if req.Type != "booking" {
			var activeNow int64
			tx.Model(&models.Transaction{}).
				Where("item_id = ?", itemID).
				Where("status IN ?", []string{"pending", "approved", "borrowed"}).
				Where("borrow_date <= ? AND est_return_date >= ?", time.Now(), time.Now()).
				Count(&activeNow)

			if activeNow+1 >= int64(finalItem.TotalStock) {
				tx.Model(&finalItem).Where("id = ?", itemID).Update("status", "reserved")
			}
		}

		// F. Simpan Transaksi ke Database
		finalTransaction = models.Transaction{
			TransactionCode: utils.GenerateTransactionCode(),
			ItemID:          finalItem.ID,
			BorrowerID:      borrower.ID,
			Purpose:         req.Purpose,
			BorrowDate:      startDate,
			EstReturnDate:   estReturnDate,
			Status:          "pending",
			Notes:           req.Notes,
			IsManual:        false,
			Attachment:      req.Attachment,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := tx.Create(&finalTransaction).Error; err != nil {
			return errors.New("Gagal mencatat peminjaman: " + err.Error())
		}

		// Load relasi buat dikirim ke frontend
		tx.Preload("Item").Preload("Borrower").First(&finalTransaction, finalTransaction.ID)

		// Return nil artinya TIDAK ADA ERROR -> Data resmi di-COMMIT ke database!
		return nil
	})

	// 4. Tangkap jika ada error dari dalam blok transaksi tadi (termasuk kalau keduluan orang lain)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// 5. Berhasil Total
	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Barang berhasil dipinjam/dibooking!",
		"transaction": finalTransaction,
		"item":        finalItem,
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
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		db.Create(&borrower)
	}

	// âœ… UPDATE STATUS ITEM MENJADI BORROWED
	if err := db.Model(&item).Where("id = ?", req.ItemID).Updates(map[string]interface{}{
		"status":     "borrowed",
		"updated_at": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengupdate status barang: " + err.Error(),
		})
		return
	}

	// Reload item
	db.First(&item, req.ItemID)

	// Create transaction
	transaction := models.Transaction{
		TransactionCode: utils.GenerateTransactionCode(),
		ItemID:          item.ID,
		BorrowerID:      borrower.ID,
		Purpose:         req.Purpose,
		BorrowDate:      time.Now(),
		EstReturnDate:   estReturnDate,
		Status:          "borrowed",
		Notes:           req.Notes,
		IsManual:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	db.Create(&transaction)
	db.Preload("Item").Preload("Borrower").First(&transaction, transaction.ID)

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

	// Update item status back to available (hanya update field yang diperlukan)
	if err := db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Updates(map[string]interface{}{
		"status":     "available",
		"updated_at": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengupdate status barang: " + err.Error(),
		})
		return
	}

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

// Struct untuk request Approve/Reject dari Admin
type ApproveTransactionReq struct {
	Action  string `json:"action" binding:"required"`
	Notes   string `json:"notes"`
	TrxType string `json:"trx_type"` // âœ… TAMBAHIN INI: Biar frontend yang nentuin jenisnya!
}

// âœ… FIX FINAL: ApproveTransaction (Anti Zona Waktu Ngawur)
func ApproveTransaction(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var req ApproveTransactionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	var transaction models.Transaction
	if err := db.Preload("Item").First(&transaction, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Transaksi tidak ditemukan"})
		return
	}

	// ðŸ•µï¸ LOGIC SAKTI BARU: Dengerin perintah langsung dari Frontend!
	// Gak usah hitung selisih menit lagi yang rawan bug zona waktu SQLite.
	isBooking := req.TrxType == "booking"

	if req.Action == "approve" {
		if transaction.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Transaksi ini sudah diproses"})
			return
		}

		if isBooking {
			// Booking: status approved, item langsung "borrowed" (direservasi peminjam)
			transaction.Status = "approved"
			db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Update("status", "borrowed")
		} else {
			// JALUR OTS: Status langsung 'borrowed'.
			transaction.Status = "borrowed"
			// ✅ FIX: Item status langsung "borrowed" tanpa cek stok penuh
			db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Update("status", "borrowed")
		}

	} else if req.Action == "handover" {
		if transaction.Status != "approved" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Transaksi belum disetujui"})
			return
		}

		var item models.Item
		db.First(&item, transaction.ItemID)
		if item.Status == "maintenance" || item.Status == "damaged" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Tidak bisa menyerahkan! Barang sedang rusak/perawatan."})
			return
		}

		transaction.Status = "borrowed"
		// ✅ FIX: Item status langsung "borrowed" (handover = barang fisik diserahkan)
		db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Update("status", "borrowed")

	} else if req.Action == "reject" {
		// Jika Ditolak: Transaksi batal
		transaction.Status = "rejected"

		// ✅ FIX: Cek apakah ada transaksi aktif lain sebelum set "available"
		var otherActive int64
		db.Model(&models.Transaction{}).
			Where("item_id = ? AND id != ?", transaction.ItemID, transaction.ID).
			Where("status IN ?", []string{"pending", "approved", "borrowed"}).
			Count(&otherActive)

		if otherActive == 0 {
			db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Update("status", "available")
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Aksi tidak valid"})
		return
	}

	// âœ… FIX CELAH INFORMASI: Simpan catatan/alasan tolak ke database!
	if req.Notes != "" {
		transaction.Notes = req.Notes
	}

	transaction.UpdatedAt = time.Now()
	db.Save(&transaction)

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Transaksi berhasil divalidasi", "data": transaction})
}

// GetItemBookings - Ambil antrean jadwal suatu barang (Traveloka Lite)
func GetItemBookings(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	itemID := c.Param("id")

	var bookings []models.Transaction
	// Ambil transaksi yg statusnya ngunci barang, dan masa kembalinya masih di masa depan
	db.Where("item_id = ?", itemID).
		Where("status IN ?", []string{"pending", "approved", "borrowed"}).
		Where("est_return_date >= ?", time.Now()).
		Order("borrow_date ASC").
		Select("id, borrow_date, est_return_date, status"). // Cuma ambil data penting biar ringan
		Find(&bookings)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   bookings,
	})
}

// GetTransactionsByNIM - Buat mahasiswa cek status peminjaman mandiri
func GetTransactionsByNIM(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	nim := c.Query("nim")

	if nim == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "NIM wajib dimasukkan!"})
		return
	}

	// 1. Cari mahasiswanya ada atau nggak
	var borrower models.Borrower
	if err := db.Where("identity_no = ?", nim).First(&borrower).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "NIM tidak ditemukan. Kamu belum pernah meminjam barang."})
		return
	}

	// 2. Ambil semua transaksinya (termasuk relasi barang)
	var transactions []models.Transaction
	db.Preload("Item").Where("borrower_id = ?", borrower.ID).Order("created_at DESC").Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"borrower_name": borrower.Name,
			"transactions":  transactions,
		},
	})
}
