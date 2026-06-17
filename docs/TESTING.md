# 🧪 Master Testing Document (End-to-End) - Inflashtory

**Branch Target:** `testing`
**Fokus Pengujian:** PWA, Frontend (React/Vite), Backend (Golang), Database, & Keamanan.
**Instruksi untuk AI Agent:** Jalankan seluruh skenario di bawah ini. Jika ada yang berstatus *Failed*, catat log *error*-nya di file `docs/error-report.md`.

---

## 📱 1. PWA & Frontend Resilience (Daya Tahan UI)

| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FE-01** | *Offline Mode Survival* | Matikan koneksi, jalankan `npm run preview`, muat ulang (`Ctrl+R`) di rute `/items`. | Tidak ada layar Dinosaurus/Blank. PWA merender UI lokal dengan *toast* "Kamu sedang offline!". | ✅ PASS (2026-06-17 12:35) |
| **FE-02** | *Race Condition Button* | Gunakan *Network Throttling* (Slow 3G), klik tombol "Submit Peminjaman" 5x secara cepat. | Tombol berubah menjadi *disabled/loading* setelah klik pertama. Hanya 1 *request* yang terkirim ke *database*. | ✅ PASS (2026-06-17 12:56) |
| **FE-03** | *PWA Install UI* | Buka web di mode *Incognito*. Tunggu *trigger beforeinstallprompt*. | Muncul *banner* instalasi kustom di bawah layar, bukan bawaan *browser*. | ✅ PASS (2026-06-17 12:56) |

---

## 🛡️ 2. Security & Penetration (Keamanan Backend)

| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | *SQL Injection Bypass* | Isi *form* input NIM / Cek Status dengan payload: `' OR '1'='1`. | Backend Golang menolak *request* / memproses sebagai string biasa tanpa membocorkan data *database*. | ✅ PASS (2026-06-17 12:58) |
| **SEC-02** | *XSS Attack on Inputs* | Masukkan payload `<script>alert('hack')</script>` pada nama peminjam. | Data disanitasi. *Script* tidak tereksekusi saat Admin melihat detail data di *Dashboard*. | ✅ PASS (2026-06-17 13:25) |
| **SEC-03** | *JWT Token Manipulation* | Hapus atau ubah secara acak *token* *Authorization header* saat mengakses `/api/admin/dashboard`. | Backend mengembalikan status `401 Unauthorized`. Akses ditolak. | ✅ PASS (2026-06-17 13:26) |

---

## ⚙️ 3. Backend Logic & API Torture (Penyiksaan Golang)

| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BE-01** | *Empty Payload Rejection* | Tembak POST `/api/borrow` dengan *body* JSON kosong `{}` via cURL/Postman. | Backend mengembalikan `400 Bad Request` dengan pesan *error* validasi yang spesifik. | ✅ PASS (2026-06-17 12:59) |
| **BE-02** | *Data Type Mismatch* | Tembak *endpoint* peminjaman dengan memasukkan *string* "A" ke parameter `item_id` (yang seharusnya *integer*). | Backend tidak *crash/panic*, mengembalikan `400 Bad Request`. | ✅ PASS (2026-06-17 13:27) |
| **BE-03** | *Stock Negative Prevention* | Paksa API mengurangi `stock` barang yang saat ini sudah berstatus 0. | Transaksi digagalkan oleh *database/logic*, stok tidak boleh menjadi `-1`. | ✅ PASS (2026-06-17 13:34) |

---

## 🚀 4. Core Business Flow (Alur Peminjaman & OTS)

| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BIZ-01** | *QR Code Validasi OTS* | Pindai QR Code usang/palsu yang ID-nya tidak ada di *database*. | Sistem memunculkan notifikasi "Barang tidak ditemukan atau QR tidak valid". | ✅ PASS (2026-06-17 15:55) |
| **BIZ-02** | *Conflict Booking Time* | Lakukan 2 *booking* Web dari perangkat berbeda untuk barang dan jam yang persis sama, dengan sisa stok 1. | *Booking* pertama berhasil. *Booking* kedua ditolak dengan pesan "Stok tidak mencukupi untuk waktu tersebut". | ✅ PASS (2026-06-17 15:55) |
| **BIZ-03** | *Digital Receipt Creation* | Selesaikan peminjaman normal (OTS maupun Web). | Resi/Karcis digital warna ungu muncul. Informasi sesuai dengan yang di-input. | ✅ PASS (2026-06-17 13:39) |
| **BIZ-04** | *Approval Admin Flow* | Login sebagai Admin, ubah status "Menunggu ACC" menjadi "Disetujui". | Data di halaman Cek Status Publik otomatis berubah menjadi "Disetujui". | ✅ PASS (2026-06-17 13:43) |

---

## 📑 Prosedur Laporan (Bagi AI Agent)
1. Jika status diubah menjadi `✅ PASS`, sertakan waktu pengujian di sebelahnya.
2. Jika status diubah menjadi `❌ FAIL`, buat *file* terpisah untuk menjelaskan *stack trace* dan lokasi baris kode yang menyebabkan *error*.