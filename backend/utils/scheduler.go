package utils

import (
	"fmt"
	"log"
	"time"

	"inventory-api/models"

	"gorm.io/gorm"
)

// StartAutoCancelCron - Mesin yang jalan di background
func StartAutoCancelCron(db *gorm.DB) {
	// TICKER: Ngatur seberapa sering mesin ini jalan ngecek database.
	// Di mode produksi, set ke 1 jam (1 * time.Hour) atau 30 menit.
	// ⚠️ UNTUK TESTING SEMENTARA, SET KE 10 DETIK BIAR BISA LU LIAT LANGSUNG!
	ticker := time.NewTicker(1 * time.Hour)

	// go func() adalah GOROUTINE: Bikin dia jalan di dimensi lain biar server Gin lu nggak nyangkut
	go func() {
		for {
			<-ticker.C
			runAutoCancel(db)
		}
	}()
}

// Eksekusi pembersihan
func runAutoCancel(db *gorm.DB) {
	// Waktu batas toleransi: 2 Jam dari jadwal ambil (BorrowDate)
	// Artinya: Kalau sekarang jam 14:00, dia bakal nyari jadwal ambil yang ada di Bawah jam 12:00
	thresholdTime := time.Now().Add(-2 * time.Hour)

	var expiredTransactions []models.Transaction

	// Cari transaksi yang statusnya 'approved' TAPI jadwal ambilnya udah kadaluwarsa
	db.Where("status = ?", "approved").
		Where("borrow_date <= ?", thresholdTime).
		Find(&expiredTransactions)

	if len(expiredTransactions) > 0 {
		fmt.Printf("\n[CRON JOB] Menemukan %d booking kadaluwarsa! Membersihkan...\n", len(expiredTransactions))
	}

	for _, trx := range expiredTransactions {
		// Ubah status jadi ditolak / hangus
		trx.Status = "rejected"
		trx.Notes = "⚠️ Dibatalkan otomatis oleh sistem: Terlambat mengambil barang lebih dari 2 jam dari jadwal."
		trx.UpdatedAt = time.Now()

		db.Save(&trx)

		log.Printf("[AUTO-CANCEL] Booking TRX-%d atas nama ID Peminjam %d hangus!", trx.ID, trx.BorrowerID)
	}
}
