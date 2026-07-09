# Set Railway environment variables for inflashstory-backend
# Run from: backend folder

Write-Host "Setting Railway environment variables..." -ForegroundColor Cyan

$vars = @(
    "DB_DRIVER=mysql",
    'DB_HOST=${{MySQL.MYSQLHOST}}',
    'DB_PORT=${{MySQL.MYSQLPORT}}',
    'DB_USER=${{MySQL.MYSQLUSER}}',
    'DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}',
    'DB_NAME=${{MySQL.MYSQLDATABASE}}',
    "PORT=8080",
    "GIN_MODE=release",
    "JWT_SECRET=inflashstory-production-secret-2026",
    "ADMIN_USERNAME=admin",
    "ADMIN_PASSWORD=admin123"
)

foreach ($var in $vars) {
    Write-Host "  → Setting $($var.Split('=')[0])..." -ForegroundColor Yellow
    railway variables set $var
}

Write-Host ""
Write-Host "Done! Setting CORS placeholder (update after Vercel deploy)..." -ForegroundColor Cyan
railway variables set FRONTEND_URL=https://placeholder.vercel.app
railway variables set 'CORS_ORIGINS=https://placeholder.vercel.app'

Write-Host ""
Write-Host "All variables set!" -ForegroundColor Green
