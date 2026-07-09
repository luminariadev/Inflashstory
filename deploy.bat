@echo off
chcp 65001 >nul
title Inflashstory Auto Deploy

echo ========================================
echo   Inflashstory - Deploy Otomatis
echo   Railway (Backend) + Vercel (Frontend)
echo ========================================
echo.

:: ─── CEK ROOT PROJECT ───
if not exist backend\main.go (
    echo [ERROR] Jalankan script ini dari folder root project!
    pause
    exit /b 1
)

:: ─── STEP 1: CEK TOOLS ───
echo [1/6] Mengecek Railway CLI...
railway --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INSTALL] Installing Railway CLI...
    npm install -g @railway/cli
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal install Railway CLI!
        pause
        exit /b 1
    )
)
echo        Railway CLI siap!

echo [1/6] Mengecek Vercel CLI...
vercel --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INSTALL] Installing Vercel CLI...
    npm install -g vercel
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal install Vercel CLI!
        pause
        exit /b 1
    )
)
echo        Vercel CLI siap!
echo.

:: ─── STEP 2: PUSH KE GITHUB ───
echo [2/6] Push ke GitHub (branch: testing)...
git add -A
git commit -m "deploy: push ke production [%date% %time%]" 2>nul || echo        (Tidak ada perubahan baru)
git push origin testing
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal push ke GitHub! Pastikan ada koneksi internet.
    pause
    exit /b 1
)
echo        Code berhasil di-push ke GitHub!
echo.

:: ─── STEP 3: CEK LOGIN RAILWAY ───
echo [3/6] Mengecek Railway login...
railway whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LOGIN] Buka browser untuk login Railway...
    railway login
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal login Railway!
        pause
        exit /b 1
    )
)
echo        Railway sudah login!
echo.

:: ─── STEP 4: DEPLOY BACKEND KE RAILWAY ───
echo [4/6] Deploy Backend ke Railway...
echo.
cd backend

:: Cek apakah sudah di-link ke project Railway
railway status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Belum ada project Railway. Membuat project baru...
    railway init --name "inflashstory-backend"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal membuat project Railway!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo        Terhubung ke project Railway yang ada.
)

:: Tambah MySQL plugin
echo [INFO] Menambahkan MySQL database...
railway add --plugin mysql 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] MySQL mungkin sudah ada, lanjut...
)

:: Set environment variables (DB_HOST dan DB_USER dari MySQL plugin Railway otomatis)
echo [INFO] Setting environment variables...
railway variables set DB_DRIVER=mysql
railway variables set DB_PORT=3306
railway variables set DB_NAME=railway
railway variables set PORT=8080
railway variables set GIN_MODE=release
railway variables set JWT_SECRET=inflashstory-production-secret-2026
railway variables set ADMIN_USERNAME=admin
railway variables set ADMIN_PASSWORD=admin123

:: Deploy backend
echo [DEPLOY] Deploying backend ke Railway...
railway up --detach
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal deploy backend!
    cd ..
    pause
    exit /b 1
)
cd ..
echo        Backend sedang di-deploy ke Railway!
echo.

:: ─── STEP 5: CEK LOGIN VERCEL ───
echo [5/6] Mengecek Vercel login...
vercel whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LOGIN] Login ke Vercel...
    vercel login
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal login Vercel!
        pause
        exit /b 1
    )
)
echo        Vercel sudah login!
echo.

:: ─── STEP 6: DEPLOY FRONTEND KE VERCEL ───
echo [6/6] Deploy Frontend ke Vercel...
echo.
cd frontend

:: Build check
echo [BUILD] Mengecek build frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build gagal! Cek error di atas.
    cd ..
    pause
    exit /b 1
)

:: Deploy ke Vercel
echo [DEPLOY] Deploying frontend ke Vercel...
vercel --prod --yes
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal deploy ke Vercel!
    cd ..
    pause
    exit /b 1
)
cd ..
echo        Frontend deployed ke Vercel!
echo.

:: ─── SELESAI ───
echo ========================================
echo   DEPLOYMENT SELESAI!
echo ========================================
echo.
echo LANGKAH SELANJUTNYA (WAJIB):
echo.
echo 1. Buka Railway dashboard: https://railway.app/dashboard
echo    - Tunggu backend selesai deploy (status: Active)
echo    - Klik backend service - Settings - Networking
echo    - Copy Railway URL (misal: inflashstory-backend.up.railway.app)
echo.
echo 2. Buka Vercel dashboard: https://vercel.com/dashboard
echo    - Temukan project frontend
echo    - Copy Vercel URL (misal: inflashstory.vercel.app)
echo.
echo 3. Update Railway env vars (di Railway dashboard atau jalankan):
echo    railway variables set FRONTEND_URL=https://[VERCEL-URL]
echo    railway variables set CORS_ORIGINS=https://[VERCEL-URL]
echo.
echo 4. Update Vercel env var (di Vercel dashboard - Settings - Environment Variables):
echo    VITE_API_URL = https://[RAILWAY-URL]/api
echo    Lalu trigger redeploy di Vercel dashboard.
echo.
echo 5. Login Admin:
echo    URL : https://[VERCEL-URL]/admin/login
echo    User: admin
echo    Pass: admin123
echo ========================================
pause