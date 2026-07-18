# Set environment variables for BG HUB Consulting LTD LogBook System
$env:DATABASE_URL = "postgresql://postgres:BobGrogan2026@localhost:5432/logbook_db"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:NEXTAUTH_SECRET = "bgc-logbook-secret-key-development-only"
$env:UPLOADTHING_SECRET = "your-uploadthing-secret"
$env:UPLOADTHING_APP_ID = "your-uploadthing-app-id"
$env:EMAIL_FROM = "noreply@bobgroganconsulting.com"
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
$env:SMTP_USER = "your-email@gmail.com"
$env:SMTP_PASSWORD = "your-app-password"

Write-Host "Environment variables set:"
Write-Host "DATABASE_URL: $env:DATABASE_URL"
Write-Host "NEXTAUTH_URL: $env:NEXTAUTH_URL"
Write-Host "Starting BG HUB Consulting LTD LogBook System..."

# Start the development server
npm run dev
