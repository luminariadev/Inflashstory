# INFLASHSTORY - FST INTEGRATION GUIDE (AI AGENT CONTEXT)

## 1. PROJECT OVERVIEW
- **Project Name:** Inflashstory
- **Description:** Aplikasi manajemen inventaris dan peminjaman barang/ruangan berbasis Web & QR Code untuk lingkungan kampus Fakultas Sains dan Teknologi (FST).
- **Frontend Stack:** React, Tailwind CSS, PWA (Progressive Web App) Support.
- **Backend Stack:** Golang (1.21+).
- **Active Branch:** `testing` (STRICT RULE: All updates must be based on the latest commit of this branch, i.e., "feat(ui): refactor manual admin form..." dated 22 June 2026). Do NOT use `main` or `feature/pwa-uiux-revamp`.

## 2. STRICT RULES FOR AI AGENT
1. **No Hallucination on Stack:** Stick strictly to React (Frontend) and Golang (Backend). Do not introduce new frameworks (e.g., Livewire is strictly prohibited).
2. **Code Modification Format:** Whenever generating code modifications, you MUST provide the output using a strict "BEFORE and AFTER" code block format to track updates accurately.
3. **PWA Integrity:** Do not modify or break existing PWA service workers or custom install banners unless explicitly instructed.
4. **Role Assumption:** The system is developed individually by a single developer ("saya"). Act as an assistant to this developer.

## 3. INTEGRATION GOALS (FST REQUIREMENTS)
This phase focuses on upgrading the existing inventory system to meet the official FST operational standards before July 10, 2026. The key features to implement are:

### A. Item & Room Expansion (Kategori Ruangan)
- **Current State:** System only handles physical items with QR codes.
- **Target State:** Add "Ruangan" (Rooms, e.g., Aula, Ruang Sidang) as a valid borrowable category. QR Code generation for "Ruangan" must be OPTIONAL, not mandatory.

### B. Digital Document Upload (Persetujuan Peminjaman)
- **Current State:** Booking is done via simple form submission.
- **Target State:** Users MUST upload mandatory digital documents (Surat Permohonan PDF & KTP Image) during the booking process. Backend must handle file parsing, saving to local storage/server, and path reference in the database.

### C. Single Admin Management & User Validation
- **Current State:** Basic manual admin form exists.
- **Target State:** 
  - Ensure a single `Super_Admin` role handles all approvals.
  - Prepare Regex validation or backend logic to ensure only specific NIM (Mahasiswa) and NIP (Dosen/Tendik) formats are accepted (API Salam integration readiness).

## 4. EXECUTION PLAN (TO-DO LIST)
Agent, when instructed, follow these steps sequentially:
- [ ] **Step 1:** Update Golang Database Schema (GORM models) to accommodate `category_type` (Barang/Ruangan) and file path columns (`surat_url`, `ktp_url`).
- [ ] **Step 2:** Build Golang API Endpoints for `multipart/form-data` to handle file uploads securely.
- [ ] **Step 3:** Update React UI Frontend (Booking Form) to include file upload inputs and category selection (Barang vs Ruangan).