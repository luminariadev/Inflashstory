package utils

import (
	"fmt"
	"log"
	"os"
	"time"

	"inventory-api/models"

	"gorm.io/gorm"
)

// InitCronJobs initializes background tasks such as anti-ghosting
func InitCronJobs(db *gorm.DB) {
	ticker := time.NewTicker(1 * time.Hour)

	go func() {
		for {
			select {
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
		// Hapus file dokumen secara fisik
		if booking.SuratURL != "" {
			_ = os.Remove("." + booking.SuratURL)
		}
		if booking.KtpURL != "" {
			_ = os.Remove("." + booking.KtpURL)
		}

		// Update status jadi cancelled
		db.Model(&booking).Updates(map[string]interface{}{
			"status": "cancelled",
			"notes":  "Dibatalkan otomatis oleh sistem (Lewat batas waktu pengambilan 1x24 jam)",
		})
	}

	if len(expiredBookings) > 0 {
		log.Printf("[CRON] Successfully cancelled %d ghosted bookings.\n", len(expiredBookings))
	}
}
