package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// GenerateTransactionCode generates unique transaction code
func GenerateTransactionCode() string {
	return fmt.Sprintf("TRX-%d-%s", time.Now().UnixNano(), randomString(4))
}

// GenerateBookingCode generates unique booking code
func GenerateBookingCode() string {
	return fmt.Sprintf("BK-%d-%s", time.Now().UnixNano(), randomString(4))
}

// GenerateItemCode generates item code
func GenerateItemCode(seq int) string {
	return fmt.Sprintf("INV-%d-%04d", time.Now().Year(), seq)
}

// randomString generates random string of length n
func randomString(n int) string {
	bytes := make([]byte, n)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:n]
}

// ParseDate parses date string to time.Time
func ParseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// IsOverdue checks if est_return_date is past
func IsOverdue(estReturnDate time.Time) bool {
	return time.Now().After(estReturnDate)
}

// ToJSON converts interface to JSON string (FIXED)
func ToJSON(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return "{}"
	}
	return string(b)
}
