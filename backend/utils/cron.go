package utils

import (
	"context"
	"log"
	"os"
	"time"

	"inventory-api/models"

	"gorm.io/gorm"
)

// InitCronJobs initializes background tasks such as anti-ghosting
func InitCronJobs(ctx context.Context, db *gorm.DB) {
	ticker := time.NewTicker(1 * time.Hour)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				log.Println("[CRON] Shutting down anti-ghosting job...")
				return
			case <-ticker.C:
				runAntiGhostingJob(db)
			}
		}
	}()
	
	// Run once on startup just in case
	go runAntiGhostingJob(db)
}

func runAntiGhostingJob(db *gorm.DB) {
	log.Println("[CRON] Running anti-ghosting check for approved bookings...")

	// Threshold: 24 hours ago
	threshold := time.Now().Add(-24 * time.Hour)

	var expiredBookings []models.Booking
	
	// Cari booking yang expired
	db.Where("status = ? AND start_date < ?", "approved", threshold).Find(&expiredBookings)

	if len(expiredBookings) > 0 {
		log.Printf("[CRON] Menemukan %d ghosted bookings. Membersihkan data dan file...\n", len(expiredBookings))
	}

	for _, booking := range expiredBookings {
		// ✅ FIX N14: Update DB dulu, pastikan sukses, baru hapus file fisik (Atomicity Gap fixed)
		// Update status jadi cancelled
		err := db.Model(&booking).Updates(map[string]interface{}{
			"status": "cancelled",
			"notes":  "Dibatalkan otomatis oleh sistem (Lewat batas waktu pengambilan 1x24 jam)",
		}).Error

		if err == nil {
			// Hapus file dokumen secara fisik JIKA DB SUDAH TERSIMPAN
			DeleteDocumentFiles(booking.SuratURL, booking.KtpURL)
			log.Printf("[CRON] Booking %s cancelled (anti-ghosting) - Files removed", booking.BookingCode)
		} else {
			log.Printf("[CRON] Gagal update booking %s: %v", booking.BookingCode, err)
		}

		// Fix N3: Cari transaksi yang nyangkut (status borrowed) terkait booking ini
		var transaction models.Transaction
		// Karena tabel Transaction tidak memiliki field booking_id, relasi disimpan di Notes saat ApproveBooking
		if err := db.Where("notes = ? AND status = ?", "Dari booking: "+booking.BookingCode, "borrowed").First(&transaction).Error; err == nil {
			// Batalkan transaksi
			db.Model(&transaction).Update("status", "cancelled")

			// Kembalikan status item menjadi available
			db.Model(&models.Item{}).Where("id = ?", transaction.ItemID).Update("status", "available")
		}
	}

	if len(expiredBookings) > 0 {
		log.Printf("[CRON] Successfully cancelled %d ghosted bookings.\n", len(expiredBookings))
	}
}
