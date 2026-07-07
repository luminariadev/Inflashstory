package utils

import "os"

// DeleteDocumentFiles menghapus file fisik Surat Permohonan dan KTP jika ada
func DeleteDocumentFiles(suratURL, ktpURL string) {
	if suratURL != "" {
		_ = os.Remove("." + suratURL)
	}
	if ktpURL != "" {
		_ = os.Remove("." + ktpURL)
	}
}
