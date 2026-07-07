package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadDocument menangani upload file Surat Permohonan atau KTP
func UploadDocument(c *gin.Context) {
	// Ambil file dari form-data
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan dalam request"})
		return
	}

	docType := c.PostForm("type") // "surat" atau "ktp"
	if docType != "surat" && docType != "ktp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe dokumen tidak valid, gunakan 'surat' atau 'ktp'"})
		return
	}

	// ✅ FST INTEGRATION: Validasi Ukuran File (Maksimal 5MB)
	const maxUploadSize = 5 << 20 // 5 MB
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ukuran file melebihi batas maksimal 5MB"})
		return
	}

	// Validasi Ekstensi dan Tipe File
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if docType == "surat" && ext != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Surat permohonan harus berformat PDF"})
		return
	}
	if docType == "ktp" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "KTP harus berformat gambar (JPG/JPEG/PNG)"})
		return
	}

	// ✅ FIX N13: Validasi MIME Type Asli (Bukan sekadar Ekstensi)
	openedFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca file"})
		return
	}
	defer openedFile.Close()

	buff := make([]byte, 512)
	if _, err = openedFile.Read(buff); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memverifikasi isi file"})
		return
	}

	mimeType := http.DetectContentType(buff)
	if docType == "surat" && mimeType != "application/pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File surat permohonan harus berupa dokumen PDF murni (MIME mismatch)"})
		return
	}
	if docType == "ktp" && mimeType != "image/jpeg" && mimeType != "image/png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File KTP harus berupa gambar JPG/PNG murni (MIME mismatch)"})
		return
	}

	// Tentukan lokasi penyimpanan (./uploads/documents/)
	uploadDir := filepath.Join("uploads", "documents")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat direktori upload"})
		return
	}

	// Buat nama file unik (e.g., ktp_1680123456.jpg)
	timestamp := time.Now().Unix()
	newFileName := fmt.Sprintf("%s_%d%s", docType, timestamp, ext)
	
	// Path lengkap file di server
	savePath := filepath.Join(uploadDir, newFileName)

	// Simpan file ke server
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file ke server"})
		return
	}

	// Path yang akan disimpan ke database (menggunakan forward slash untuk URL/DB konsistensi)
	dbPath := filepath.ToSlash(savePath)

	// Kembalikan response berupa path file yang baru disimpan
	c.JSON(http.StatusOK, gin.H{
		"message":   "File berhasil diupload",
		"file_path": dbPath,
		"file_url":  "/" + dbPath,
	})
}
