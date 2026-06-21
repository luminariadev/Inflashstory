# 🎯 Final QA & Presentation Blueprint - Inflashtory

**Target:** `testing` branch
**Fokus Utama:** Validasi Anti-Race Condition, Real-time Status Sync, UI/UX Routing, dan PWA Prompt.
**Instruksi QA Agent:** EKSEKUSI PENGUJIAN TANPA MENGUBAH SOURCE CODE APLIKASI (Frontend/Backend). HANYA izinkan update pada file `.md` ini dan pembuatan `docs/final-error-report.md` jika ada kegagalan.

---

## 🚦 1. Anti-Race Condition & Stock Integrity (Keamanan Stok)
| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PRE-01** | *Parallel Booking Torture* | Tembak API POST `/api/borrow` secara BERSAMAAN (parallel) 3x untuk barang dengan sisa stok 1. | 1 request berhasil (200 OK), 2 request lainnya ditolak dengan pesan error "Stok tidak mencukupi...". Stok tidak menjadi minus. | ✅ PASS |

## 🔄 2. Real-Time Item Status Synchronization (Sinkronisasi Otomatis)
| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PRE-02** | *Status Mutation on Booking* | Lakukan 1 booking valid. Cek endpoint detail barang tersebut. | Field `status` barang otomatis berubah menjadi "reserved" atau stok berkurang secara akurat. | ✅ PASS |
| **PRE-03** | *Status Mutation on Admin Reject* | Login Admin, tolak (reject) transaksi dari PRE-02. Cek endpoint detail barang. | Status barang kembali "available" dan stok kembali bertambah/normal. | ✅ PASS |

## 👁️ 3. UI/UX Visibility & Routing (Tampilan User & Admin)
| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PRE-04** | *User Tab "Menunggu ACC"* | Gunakan Browser Agent, login sebagai User, buka tab "Menunggu ACC". | Halaman tidak kosong/blank. Data transaksi yang berstatus pending berhasil dirender. | ✅ PASS |
| **PRE-05** | *Admin Sidebar "Daftar Booking"* | Gunakan Browser Agent, login sebagai Admin. | Menu "Daftar Booking" terlihat jelas di sidebar navigasi Admin dan rutenya tidak error (404). | ✅ PASS |

## 📱 4. PWA Installation UI (Tampilan Instalasi)
| ID Test | Skenario Pengujian | Langkah-Langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PRE-06** | *PWA Prompt Trigger* | Trigger event `beforeinstallprompt` via Browser Agent/DevTools. | UI Prompt custom aplikasi muncul dengan styling yang rapi dan tidak bertabrakan dengan elemen lain. | ✅ PASS |