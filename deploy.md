# 🚀 Panduan Deploy Inflashstory

> Backend Go (Gin) → **Railway** | Frontend React (Vite) → **Vercel**

---

## 📋 Prasyarat

Pastikan tools berikut sudah terinstall:

```bash
node --version     # v18+ diperlukan
npm --version      # untuk install CLI
git --version      # untuk push ke GitHub
```

Install Railway & Vercel CLI (sekali saja):

```bash
npm install -g @railway/cli
npm install -g vercel
```

---

## 🏗️ Arsitektur Deployment

```
GitHub (branch: testing)
    │
    ├── /backend  ──────────────►  Railway
    │              (Dockerfile)    ├─ Service: inflashstory-api
    │                              └─ Plugin:  MySQL (auto-managed)
    │
    └── /frontend ──────────────►  Vercel
                   (Vite build)    └─ Project: frontend
```

---

## ⚙️ Konfigurasi File

### `backend/Dockerfile`
Multi-stage build dengan CGO enabled (diperlukan oleh `mattn/go-sqlite3`):

```dockerfile
FROM golang:latest AS builder
RUN apt-get update && apt-get install -y gcc libc6-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o fstorage-api main.go

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates
WORKDIR /app
COPY --from=builder /app/fstorage-api .
EXPOSE 8080
CMD ["./fstorage-api"]
```

### `backend/railway.toml`
Konfigurasi build & deploy Railway:

```toml
[build]
  builder = "dockerfile"
  dockerfilePath = "Dockerfile"

[deploy]
  startCommand = "./fstorage-api"
  healthcheckPath = "/health"       # route GET /health di routes.go
  healthcheckTimeout = 300

[variables]
  DB_DRIVER = "mysql"
  DB_PORT   = "3306"
  DB_NAME   = "railway"
  PORT      = "8080"
  GIN_MODE  = "release"
```

> **Catatan:** `DB_HOST`, `DB_USER`, `DB_PASSWORD` di-set via CLI menggunakan referensi MySQL plugin Railway.

### `frontend/vercel.json`
Fix routing React SPA (mencegah 404 saat refresh halaman):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 🔧 Langkah Setup (Pertama Kali)

### Step 1 — Login Railway

```bash
railway login
# Buka browser → authorize
```

### Step 2 — Buat Project & Tambah MySQL

```bash
cd backend
railway init --name "inflashstory-backend"
railway add --database mysql --json
```

### Step 3 — Buat Service dari GitHub

```bash
railway add --repo luminariadev/Inflashstory --branch testing --service inflashstory-api --json
railway link --project inflashstory-backend --service inflashstory-api
```

### Step 4 — Set Environment Variables Backend

Jalankan script PowerShell (sudah tersedia di `backend/set-railway-vars.ps1`):

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File set-railway-vars.ps1
```

Script ini meng-set variabel berikut:

| Variable | Nilai |
|---|---|
| `DB_DRIVER` | `mysql` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` (Railway reference) |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
| `PORT` | `8080` |
| `GIN_MODE` | `release` |
| `JWT_SECRET` | `inflashstory-production-secret-2026` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `admin123` |

### Step 5 — Generate Domain Railway & Deploy Backend

```bash
railway domain          # auto-generate URL publik
railway up --detach     # upload & build di Railway cloud
```

Output contoh:
```
Service domain created:
  URL: https://inflashstory-api-production.up.railway.app
```

### Step 6 — Login Vercel & Deploy Frontend

```bash
vercel login
# Buka browser → authorize

cd ../frontend

# Deploy pertama (dapat Vercel URL)
vercel --prod --yes

# Set env var backend URL
vercel env add VITE_API_URL production \
  --value "https://inflashstory-api-production.up.railway.app/api" \
  --yes

# Redeploy agar VITE_API_URL ter-bake ke build
vercel --prod --yes
```

### Step 7 — Update CORS di Railway

Setelah dapat Vercel URL, update CORS di Railway:

```bash
cd ../backend
railway variables set "CORS_ORIGINS=https://frontend-psi-seven-47.vercel.app"
railway variables set "FRONTEND_URL=https://frontend-psi-seven-47.vercel.app"
```

---

## 🌐 URL Production

| Service | URL |
|---|---|
| **Frontend** | https://frontend-psi-seven-47.vercel.app |
| **Backend API** | https://inflashstory-api-production.up.railway.app |
| **Admin Panel** | https://frontend-psi-seven-47.vercel.app/admin/login |
| **Health Check** | https://inflashstory-api-production.up.railway.app/health |

**Kredensial Admin:**
- Username: `admin`
- Password: `admin123`

---

## 🔄 Deploy Ulang (Berikutnya)

Cukup jalankan dari folder root:

```bash
deploy.bat
```

Script `deploy.bat` secara otomatis:
1. Cek Railway & Vercel CLI (install jika belum ada)
2. Push perubahan ke GitHub branch `testing`
3. Cek status login Railway & Vercel
4. Deploy backend ke Railway
5. Build & deploy frontend ke Vercel

Atau bisa juga manual per-service:

```bash
# Backend saja
cd backend
railway up --detach

# Frontend saja
cd frontend
vercel --prod --yes
```

---

## 🔁 CI/CD Otomatis

Railway sudah di-link ke GitHub, sehingga setiap **push ke branch `testing`** akan memicu redeploy backend secara otomatis.

Untuk frontend Vercel, sambungkan GitHub di [Vercel Dashboard → Settings → Git](https://vercel.com/dashboard) agar auto-deploy juga aktif.

---

## 🐛 Troubleshooting

### Backend gagal start (MySQL connection refused)
Buka Railway dashboard → service `inflashstory-api` → **Variables**.
Pastikan `DB_HOST`, `DB_USER`, dll. terisi nilai nyata (bukan literal `${{MySQL.MYSQLHOST}}`).
Jika masih placeholder, set manual dari tab Variables di service MySQL.

### Frontend 404 saat refresh
Pastikan `frontend/vercel.json` ada dan sudah di-push ke GitHub serta ter-deploy.

### CORS error di browser
Pastikan `CORS_ORIGINS` di Railway sudah berisi URL Vercel yang benar (tanpa trailing slash).

### Build Railway gagal (CGO error)
Pastikan `Dockerfile` menggunakan `golang:latest` (bukan alpine) dan ada langkah:
```dockerfile
RUN apt-get install -y gcc libc6-dev
```

---

## 📁 File Terkait

| File | Fungsi |
|---|---|
| [`backend/Dockerfile`](./backend/Dockerfile) | Build image Go untuk Railway |
| [`backend/railway.toml`](./backend/railway.toml) | Konfigurasi Railway (build, deploy, healthcheck) |
| [`backend/set-railway-vars.ps1`](./backend/set-railway-vars.ps1) | Script set env vars Railway via CLI |
| [`frontend/vercel.json`](./frontend/vercel.json) | Konfigurasi Vercel (SPA routing) |
| [`deploy.bat`](./deploy.bat) | Script deploy otomatis one-click |
