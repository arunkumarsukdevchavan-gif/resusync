# ResuSync Complete Startup Script
# Run this script to start both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ResuSync AI Resume Builder Startup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    return $connection
}

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = "C:\ResuSync\resume-co - A1\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test backend health
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5001/api/health" -TimeoutSec 10
    Write-Host "✅ Backend Status: $($healthCheck.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend health check failed, but continuing..." -ForegroundColor Yellow
}

# Start Frontend Server  
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = "C:\ResuSync\resume-co - A1\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Servers Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White  
Write-Host "   Health:   http://localhost:5001/api/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Open website
Write-Host "Opening ResuSync website..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "ResuSync is now running!" -ForegroundColor Green
Write-Host "Use the website to analyze resumes and generate PDFs" -ForegroundColor White
Write-Host "Features: Google Auth, Landing Page, Resume Builder, PDF Downloads" -ForegroundColor White
Write-Host "Backend and Frontend are running in separate windows" -ForegroundColor White
Write-Host "To stop servers, close the Backend and Frontend PowerShell windows" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to exit this startup script..." -ForegroundColor Gray
Read-Host