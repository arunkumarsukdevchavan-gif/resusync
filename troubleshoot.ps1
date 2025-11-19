# ResuSync Troubleshooting and Health Check Script

Write-Host "ResuSync Health Check and Troubleshooting" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required directories exist
Write-Host "Checking Project Structure..." -ForegroundColor Yellow
$requiredPaths = @(
    "C:\ResuSync\resume-co - A1\backend",
    "C:\ResuSync\resume-co - A1\frontend", 
    "C:\ResuSync\resume-co - A1\backend\package.json",
    "C:\ResuSync\resume-co - A1\frontend\package.json",
    "C:\ResuSync\resume-co - A1\backend\server.js"
)

foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "✅ $path" -ForegroundColor Green
    } else {
        Write-Host "❌ $path - MISSING!" -ForegroundColor Red
    }
}

Write-Host ""

# Check Node.js and npm
Write-Host "Checking Development Environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js: Not installed or not in PATH!" -ForegroundColor Red
}

try {
    $npmVersion = npm --version  
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm: Not installed or not in PATH!" -ForegroundColor Red
}

Write-Host ""

# Check for running processes
Write-Host "Checking Running Processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Found $($nodeProcesses.Count) Node.js processes running:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object { Write-Host "   PID: $($_.Id)" -ForegroundColor Gray }
} else {
    Write-Host "✅ No Node.js processes currently running" -ForegroundColor Green
}

# Check ports
Write-Host ""
Write-Host "Checking Port Availability..." -ForegroundColor Yellow

$ports = @(5001, 5173)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName "localhost" -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "⚠️  Port $port is in use" -ForegroundColor Yellow
        # Find what's using the port
        $process = netstat -ano | Select-String ":$port.*LISTENING"
        if ($process) {
            Write-Host "   Used by process: $process" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

Write-Host ""

# Test backend if running
Write-Host "Testing Backend Server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/api/health" -TimeoutSec 5
    Write-Host "✅ Backend Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Message: $($health.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend server not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test frontend if running  
Write-Host ""
Write-Host "Testing Frontend Server..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    Write-Host "✅ Frontend Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend server not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "1. If ports are in use, run: taskkill /F /IM node.exe" -ForegroundColor White
Write-Host "2. To start servers manually:" -ForegroundColor White
Write-Host "   Backend:  cd backend && npm start" -ForegroundColor Gray
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "3. Use start-resusync.ps1 for automatic startup" -ForegroundColor White
Write-Host "4. Check firewall/antivirus if connection refused" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
Read-Host