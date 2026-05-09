# Set environment variables for NYX LogBook System
$env:DATABASE_URL = "postgresql://postgres:Nyx2026@localhost:5432/logbook_db"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:NEXTAUTH_SECRET = "nyx-logbook-secret-key-development-only"
$env:UPLOADTHING_SECRET = "your-uploadthing-secret"
$env:UPLOADTHING_APP_ID = "your-uploadthing-app-id"
$env:EMAIL_FROM = "noreply@nyxquant.com"
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
$env:SMTP_USER = "your-email@gmail.com"
$env:SMTP_PASSWORD = "your-app-password"

Write-Host "Environment variables set:"
Write-Host "DATABASE_URL: $env:DATABASE_URL"
Write-Host "NEXTAUTH_URL: $env:NEXTAUTH_URL"
Write-Host "Starting NYX LogBook System..."

# Start the development server
npm run dev
