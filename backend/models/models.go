package models

import (
	"time"

	"gorm.io/gorm"
)

// ==================== ITEM ====================
type Item struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Name          string         `gorm:"not null;size:100" json:"name"`
	Code          string         `gorm:"unique;size:50" json:"code"`
	Category      string         `gorm:"size:50" json:"category"`
	Location      string         `gorm:"size:100" json:"location"`
	Description   string         `gorm:"size:500" json:"description"`
	Status        string         `gorm:"default:available;size:20" json:"status"` // available, borrowed, damaged, maintenance, lost
	Condition     string         `gorm:"default:good;size:20" json:"condition"`   // good, fair, damaged
	RequiredID    string         `gorm:"default:none;size:20" json:"required_id"` // none, ktm, ktp
	RequireLetter bool           `gorm:"default:false" json:"require_letter"`     // butuh surat pengantar/izin?
	ImageURL      string         `gorm:"type:longtext" json:"image_url"`          // URL atau path foto barang
	TotalStock    int            `gorm:"default:1" json:"total_stock"`            // ✅ BARU: Kuantitas barang multi-stok (Default 1 biar data lama aman)
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// ==================== BORROWER ====================
type Borrower struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"not null;size:100" json:"name"`
	IdentityNo   string    `gorm:"column:identity_no;size:20;index" json:"identity_no"` // NIM/NIP
	StudyProgram string    `gorm:"size:100" json:"study_program"`
	Class        string    `gorm:"size:50" json:"class"`
	Phone        string    `gorm:"size:15" json:"phone"`
	Email        string    `gorm:"size:100" json:"email"`
	KTMPhoto     string    `gorm:"type:longtext" json:"ktm_photo"` // foto KTM Base64
	KTPPhoto     string    `gorm:"type:longtext" json:"ktp_photo"` // foto KTP Base64
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== TRANSACTION ====================
type Transaction struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	TransactionCode  string     `gorm:"unique;size:50" json:"transaction_code"`
	ItemID           uint       `gorm:"not null;index" json:"item_id"`
	Item             Item       `gorm:"foreignKey:ItemID" json:"item"`
	BorrowerID       uint       `gorm:"not null;index" json:"borrower_id"`
	Borrower         Borrower   `gorm:"foreignKey:BorrowerID" json:"borrower"`
	Purpose          string     `gorm:"type:text" json:"purpose"`
	BorrowDate       time.Time  `gorm:"not null" json:"borrow_date"`
	EstReturnDate    time.Time  `gorm:"not null" json:"est_return_date"`
	ActualReturnDate *time.Time `json:"actual_return_date,omitempty"`
	Status           string     `gorm:"default:borrowed;size:20;index" json:"status"` // borrowed, returned, overdue
	AdminID          uint       `json:"admin_id"`                                     // admin yang mencatat (0 = otomatis dari scan QR)
	Notes            string     `gorm:"type:text" json:"notes"`
	IsManual         bool       `gorm:"default:false" json:"is_manual"`  // true = input manual admin (backup)
	Attachment       string     `gorm:"type:longtext" json:"attachment"` // File surat PDF (Base64)
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ==================== BOOKING (Fitur Lanjutan) ====================
type Booking struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	BookingCode string     `gorm:"unique;size:50" json:"booking_code"`
	ItemID      uint       `gorm:"not null;index" json:"item_id"`
	Item        Item       `gorm:"foreignKey:ItemID" json:"item"`
	BorrowerID  uint       `gorm:"not null;index" json:"borrower_id"`
	Borrower    Borrower   `gorm:"foreignKey:BorrowerID" json:"borrower"`
	Purpose     string     `gorm:"type:text" json:"purpose"`
	BookingDate time.Time  `gorm:"not null" json:"booking_date"`
	ExpiryDate  time.Time  `gorm:"not null" json:"expiry_date"`                 // +1 hari
	Status      string     `gorm:"default:pending;size:20;index" json:"status"` // pending, approved, rejected, expired, cancelled
	ApprovedBy  uint       `json:"approved_by"`                                 // admin ID
	ApprovedAt  *time.Time `json:"approved_at"`
	Notes       string     `gorm:"type:text" json:"notes"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ==================== ADMIN ====================
type Admin struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Username  string     `gorm:"unique;not null;size:50" json:"username"`
	Password  string     `gorm:"not null" json:"-"` // hashed password
	Email     string     `gorm:"size:100" json:"email"`
	Name      string     `gorm:"size:100" json:"name"`
	Role      string     `gorm:"default:admin;size:20" json:"role"`
	LastLogin *time.Time `json:"last_login"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// ==================== REQUEST STRUCTS ====================

// BorrowRequest from QR Scan & Booking Web
type BorrowRequest struct {
	BorrowerName     string `json:"borrower_name" binding:"required"`
	IdentityNo       string `json:"identity_no" binding:"required"`
	StudyProgram     string `json:"study_program"`
	Class            string `json:"class"`
	Phone            string `json:"phone" binding:"required"`
	Email            string `json:"email"`
	Purpose          string `json:"purpose" binding:"required"`
	Type             string `json:"type"`                               // ✅ BARU: Penanda 'booking' atau kosong (on-the-spot)
	StartDate        string `json:"start_date"`                         // ✅ BARU: Waktu Pengambilan dari form datetime
	EstReturnDateStr string `json:"est_return_date" binding:"required"` // ✅ UPDATE: Sekarang nampung datetime juga
	Notes            string `json:"notes"`
	IdPhoto          string `json:"id_photo"`
	Attachment       string `json:"attachment"`
}

// Manual Borrow Request (admin backup)
type ManualBorrowRequest struct {
	ItemID           uint   `json:"item_id" binding:"required"`
	BorrowerName     string `json:"borrower_name" binding:"required"`
	IdentityNo       string `json:"identity_no" binding:"required"`
	StudyProgram     string `json:"study_program"`
	Class            string `json:"class"`
	Phone            string `json:"phone" binding:"required"`
	Email            string `json:"email"`
	Purpose          string `json:"purpose" binding:"required"`
	EstReturnDateStr string `json:"est_return_date" binding:"required"`
	Notes            string `json:"notes"`
	IdPhoto          string `json:"id_photo"` // Base64 string dari frontend (KTP/KTM)
}

// Return Request
type ReturnRequest struct {
	Notes string `json:"notes"`
}

// UpdateStatusRequest
type UpdateStatusRequest struct {
	Status    string `json:"status" binding:"required"`
	Condition string `json:"condition"`
}

// Booking Request (fitur lanjutan)
type BookingRequest struct {
	ItemID           uint   `json:"item_id" binding:"required"`
	BorrowerName     string `json:"borrower_name" binding:"required"`
	IdentityNo       string `json:"identity_no" binding:"required"`
	StudyProgram     string `json:"study_program"`
	Class            string `json:"class"`
	Phone            string `json:"phone" binding:"required"`
	Email            string `json:"email"`
	Purpose          string `json:"purpose" binding:"required"`
	EstReturnDateStr string `json:"est_return_date" binding:"required"`
	Notes            string `json:"notes"`
	IdPhoto          string `json:"id_photo"` // Base64 string dari frontend (KTP/KTM)
}

// ApproveBookingRequest
type ApproveBookingRequest struct {
	Status string `json:"status" binding:"required"` // approved, rejected
	Notes  string `json:"notes"`
}

// Admin Login Request
type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}
