package controllers

import (
	"net/http"
	"time"

	"inventory-api/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetStats - Dashboard statistics
func GetStats(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var totalItems int64
	var availableItems int64
	var borrowedItems int64
	var damagedItems int64
	var activeTransactions int64
	var totalBorrowers int64
	var pendingBookings int64

	// ✅ PERBAIKAN LOGIKA PENGHITUNGAN MULTI-STOK
	db.Model(&models.Item{}).Select("COALESCE(SUM(total_stock), 0)").Scan(&totalItems) // Total seluruh unit barang

	// Hitung status fisik Item (Katalog)
	db.Model(&models.Item{}).Where("status = ?", "available").Count(&availableItems)
	db.Model(&models.Item{}).Where("status = ?", "borrowed").Count(&borrowedItems)
	db.Model(&models.Item{}).Where("status IN ?", []string{"damaged", "maintenance", "lost"}).Count(&damagedItems)

	// Hitung Status Transaksi
	db.Model(&models.Transaction{}).Where("status = ?", "borrowed").Count(&activeTransactions) // Sedang Dipinjam
	db.Model(&models.Borrower{}).Count(&totalBorrowers)                                        // Total Mahasiswa
	db.Model(&models.Transaction{}).Where("status = ?", "pending").Count(&pendingBookings)     // ✅ FIX: Ambil dari tabel Transaction, bukan Booking!

	// Today's transactions
	startOfDay := time.Now().Truncate(24 * time.Hour)
	var todayTransactions int64
	db.Model(&models.Transaction{}).Where("created_at >= ?", startOfDay).Count(&todayTransactions)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"total_items":         totalItems,
			"available_items":     availableItems,
			"borrowed_items":      borrowedItems,
			"damaged_items":       damagedItems,
			"active_transactions": activeTransactions,
			"total_borrowers":     totalBorrowers,
			"pending_bookings":    pendingBookings,
			"today_transactions":  todayTransactions,
		},
	})
}
