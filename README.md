# 📦 Inflashtory - Sistem Inventaris & Peminjaman Barang Berbasis QR Code

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

**Sistem manajemen inventaris dan peminjaman barang berbasis QR Code untuk lingkungan kampus.**

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Tentang Project

**Inflashtory** adalah aplikasi manajemen Inventaris yang memudahkan proses peminjaman barang di lingkungan kampus dengan teknologi QR Code. Sistem ini menggantikan proses manual yang memakan waktu dengan solusi digital yang cepat, transparan, dan terintegrasi.

### Masalah yang Dipecahkan

- ❌ Proses peminjaman manual yang memakan waktu
- ❌ Kesulitan melacak status barang secara real-time
- ❌ Tidak ada histori peminjaman yang terpusat
- ❌ Booking barang yang tidak terstruktur
- ❌ Pelaporan kerusakan/hilang yang sulit

### Solusi

- ✅ Scan QR Code untuk peminjaman instan
- ✅ Dashboard real-time untuk admin
- ✅ Booking system dengan approval workflow
- ✅ Tracking lengkap transaksi peminjaman
- ✅ Laporan dan statistik otomatis

---

## ✨ Fitur Utama

### 👤 User Frontend

| Fitur                | Deskripsi                                          |
| -------------------- | -------------------------------------------------- |
| **Daftar Barang**    | Lihat semua barang inventaris dengan filter status |
| **Scan QR Code**     | Scan QR untuk langsung meminjam barang             |
| **Booking Barang**   | Booking barang yang sedang dipinjam                |
| **Cek Status**       | Lihat ketersediaan barang real-time                |
| **Informasi Barang** | Detail lengkap setiap barang                       |

### 👑 Admin Panel

| Fitur                | Deskripsi                                   |
| -------------------- | ------------------------------------------- |
| **Dashboard**        | Statistik total barang, transaksi, peminjam |
| **Manajemen Barang** | CRUD barang, update status, generate QR     |
| **Booking Approval** | Approve/reject booking peminjaman           |
| **Transaksi**        | Pantau semua transaksi peminjaman           |
| **Data Peminjam**    | Lihat dan cari data peminjam                |
| **Pengembalian**     | Proses pengembalian barang                  |

### 🔧 Fitur Teknis

- ✅ Dark/Light mode
- ✅ Responsive design (Mobile & Desktop)
- ✅ Real-time status update
- ✅ QR Code generation untuk setiap barang
- ✅ Search & filter barang
- ✅ Export data (CSV)

---

## 🛠️ Tech Stack

### Backend

| Teknologi  | Versi  | Fungsi                             |
| ---------- | ------ | ---------------------------------- |
| **Go**     | 1.21+  | Bahasa pemrograman backend         |
| **Gin**    | v1.9+  | Web framework                      |
| **GORM**   | v1.25+ | ORM untuk database                 |
| **SQLite** | 3.x    | Database (bisa diganti PostgreSQL) |
| **JWT**    | v5     | Authentication (admin)             |
| **Bcrypt** | -      | Password hashing                   |

### Frontend

| Teknologi            | Versi | Fungsi           |
| -------------------- | ----- | ---------------- |
| **React**            | 18.x  | UI library       |
| **React Router DOM** | v6    | Routing          |
| **Axios**            | v1.x  | HTTP client      |
| **Chart.js**         | v4.x  | Statistik charts |
| **Tailwind CSS**     | v3.x  | Styling          |
| **Framer Motion**    | v10.x | Animasi          |

### Development Tools

| Tools        | Fungsi              |
| ------------ | ------------------- |
| **Air**      | Hot reload untuk Go |
| **Vite**     | Build tool frontend |
| **ESLint**   | Linter JavaScript   |
| **Prettier** | Code formatter      |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  User Page  │  │ Admin Page  │  │ QR Scanner Integration  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Axios    │ │ Context  │ │ Router   │ │ Tailwind CSS     │   │
│  │ HTTP     │ │ API      │ │ DOM      │ │ Components       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Go + Gin)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │ Middlewares  │ │   Routes     │ │    Controllers       │    │
│  │ - CORS       │ │  - /api/*    │ │  - ItemController    │    │
│  │ - Auth       │ │  - /admin/*  │ │  - BorrowController  │    │
│  │ - DB注入      │ │              │ │  - AdminController   │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite/GORM)                      │
│  ┌────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐    │
│  │ Items  │ │Borrowers │ │Transactions│ │    Bookings     │    │
│  └────────┘ └──────────┘ └────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Alur Data Peminjaman

```
1. User scan QR Code
   ↓
2. Frontend request ke API /borrow/:id
   ↓
3. Backend cek status barang
   ↓
4. Jika available → create transaction
   ↓
5. Update status barang jadi 'borrowed'
   ↓
6. Return response ke frontend
   ↓
7. Tampilkan notifikasi sukses
```

---

## 📦 Prerequisites

### Wajib Install

```bash
# Go 1.21 atau lebih baru
go version
# Output: go version go1.21.0

# Node.js 18.x atau lebih baru
node --version
# Output: v18.17.0

# npm atau pnpm
npm --version
# Output: 9.6.7

# Git
git --version
```

### Opsional (Recommended)

```bash
# Air untuk hot reload Go
go install github.com/cosmtrek/air@latest

# PostgreSQL (untuk production)
```

---

## 🚀 Instalasi

### Clone Repository

```bash
git clone https://github.com/luminariadev/Inflashstory.git
cd Inflashstory
```

### Backend Setup

```bash
# Masuk ke folder backend
cd backend

# Download dependencies
go mod tidy

# Copy environment variables
cp .env.example .env

# Jalankan server
go run main.go
```

### Frontend Setup

```bash
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

---

## ⚙️ Konfigurasi

### Backend (.env)

```env
# Server Configuration
PORT=8080
GIN_MODE=debug

# Database Configuration
DB_DRIVER=sqlite
DB_PATH=./inventory.db

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this

# Admin Default Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8080/api
VITE_ADMIN_TOKEN=admin-secret-key
```

### Database Migration

```bash
# Auto migrate akan berjalan otomatis saat server start
# Tabel yang dibuat:
# - items
# - borrowers
# - transactions
# - bookings
# - admins

# Seed data awal (5 barang + 1 admin) akan otomatis diisi
```

---

## 🏃 Menjalankan Aplikasi

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
go run main.go

# Atau dengan Air (hot reload)
air
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Akses aplikasi:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Admin Panel: http://localhost:5173/admin/login

### Production Build

**Backend:**

```bash
cd backend
go build -o inflashstory-api
./inflashstory-api
```

**Frontend:**

```bash
cd frontend
npm run build
# Hasil build di folder /dist
```

### Default Admin Credentials

```
Username: admin
Password: admin123
```

---

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint          | Deskripsi             |
| ------ | ----------------- | --------------------- |
| GET    | `/api/items`      | Get all items         |
| GET    | `/api/items/:id`  | Get item by ID        |
| GET    | `/api/stats`      | Get dashboard stats   |
| POST   | `/api/borrow/:id` | Borrow item (QR scan) |

### Admin Endpoints (Header: `X-Admin-Token: admin-secret-key`)

#### Authentication

| Method | Endpoint           | Deskripsi   |
| ------ | ------------------ | ----------- |
| POST   | `/api/admin/login` | Admin login |

#### Items Management

| Method | Endpoint                      | Deskripsi          |
| ------ | ----------------------------- | ------------------ |
| POST   | `/api/admin/items`            | Create item        |
| PUT    | `/api/admin/items/:id`        | Update item        |
| DELETE | `/api/admin/items/:id`        | Delete item        |
| PATCH  | `/api/admin/items/:id/status` | Update status item |

#### Transactions

| Method | Endpoint                  | Deskripsi            |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/admin/transactions` | Get all transactions |
| POST   | `/api/admin/return/:id`   | Process return       |

#### Bookings

| Method | Endpoint                          | Deskripsi              |
| ------ | --------------------------------- | ---------------------- |
| GET    | `/api/admin/bookings`             | Get all bookings       |
| PUT    | `/api/admin/bookings/:id/approve` | Approve/reject booking |

#### Borrowers

| Method | Endpoint               | Deskripsi         |
| ------ | ---------------------- | ----------------- |
| GET    | `/api/admin/borrowers` | Get all borrowers |

---

## 🗄️ Database Schema

### Items Table

```sql
CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    category VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    condition VARCHAR(50) DEFAULT 'good',
    description TEXT,
    image_url TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

### Borrowers Table

```sql
CREATE TABLE borrowers (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    identity_no VARCHAR(100),
    study_program VARCHAR(255),
    class VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at DATETIME
);
```

### Transactions Table

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    item_id INTEGER,
    borrower_id INTEGER,
    borrow_date DATETIME,
    est_return_date DATETIME,
    actual_return_date DATETIME,
    status VARCHAR(50) DEFAULT 'borrowed',
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id)
);
```

### Bookings Table

```sql
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    item_id INTEGER,
    borrower_id INTEGER,
    booking_date DATETIME,
    expiry_date DATETIME,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id)
);
```

### Admins Table

```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at DATETIME
);
```

---

## 🚢 Deployment

### Deploy ke VPS (Ubuntu/Debian)

**1. Setup Backend**

```bash
# Install Go
sudo apt update
sudo apt install golang-go

# Clone & build
git clone https://github.com/luminariadev/Inflashstory.git
cd Inflashstory/backend
go build -o inflashstory-api

# Create systemd service
sudo nano /etc/systemd/system/inflashstory.service
```

```ini
[Unit]
Description=Inflashstory API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/Inflashstory/backend
ExecStart=/var/www/Inflashstory/backend/inflashstory-api
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl enable inflashstory
sudo systemctl start inflashstory
```

**2. Setup Frontend**

```bash
# Install nginx
sudo apt install nginx

# Build frontend
cd ../frontend
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/html/
```

**3. Nginx Configuration**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Deploy ke Railway / Render

**Backend (Railway):**

```bash
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "cd backend && go run main.go"
```

**Frontend (Vercel):**

```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

| Masalah                      | Solusi                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Port 8080 already in use** | `lsof -i :8080` lalu `kill -9 PID`                                                |
| **Database locked**          | Hapus file `inventory.db` lalu restart                                            |
| **CORS error**               | Cek `.env` CORS_ORIGINS sudah benar                                               |
| **Admin login gagal**        | Reset password via SQLite: `UPDATE admins SET password = bcrypt_hash('admin123')` |
| **QR Code tidak terbaca**    | Pastikan URL backend di `.env` sesuai                                             |
| **Build failed**             | `rm -rf node_modules package-lock.json && npm install`                            |

### Debug Mode

```bash
# Backend debug
export GIN_MODE=debug
go run main.go

# Frontend debug
npm run dev -- --host
```

### Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# Buka DevTools browser (F12) → Console tab
```

---

## 🤝 Contributing

```bash
# 1. Fork repository
# 2. Clone fork Anda
git clone https://github.com/username/Inflashstory.git

# 3. Buat branch fitur
git checkout -b feature/new-feature

# 4. Commit perubahan
git commit -m "feat: add new feature"

# 5. Push ke branch
git push origin feature/new-feature

# 6. Buat Pull Request
```

### Coding Standards

- **Go**: Ikuti `gofmt` dan `golint`
- **React**: Gunakan functional components & hooks
- **CSS**: Gunakan Tailwind utility classes
- **Commit**: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

---

## 📄 License

Distributed under MIT License. See `LICENSE` for more information.

---

## 👥 Contact

**Developer Team**

- GitHub: [@luminariadev](https://github.com/luminariadev)

**Project Links**

- Repository: https://github.com/luminariadev/Inflashstory
- Issues: https://github.com/luminariadev/Inflashstory/issues

---

## 🙏 Acknowledgments

- Material Icons by Google
- Chart.js for beautiful charts
- Tailwind CSS community
- Gin framework team

---

<div align="center">
  <sub>Built with ❤️ for better inventory management</sub>
</div>
