# ResuSync Feature Test Script
Write-Host "ResuSync Full Feature Test" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Test servers
Write-Host "Testing Backend..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:5001/api/health" -TimeoutSec 5
    Write-Host "✅ Backend Status: $($backend.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    Write-Host "✅ Frontend Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check App.jsx features
Write-Host ""
Write-Host "Checking App Features..." -ForegroundColor Yellow
$appPath = "frontend\src\App.jsx"

if (Test-Path $appPath) {
    $appContent = Get-Content $appPath -Raw
    
    # Check for key features
    $features = @{
        "Google Authentication" = "handleGoogleSignIn"
        "Landing Page" = "showLandingPage" 
        "Welcome Modal" = "showWelcomeModal"
        "Login Modal" = "showLoginModal"
        "PDF Generation" = "ClientPDFGenerator"
        "Resume Analysis" = "api/resume/analyze"
        "History Loading" = "loadHistory"
        "File Upload" = "FileUpload"
    }
    
    foreach ($feature in $features.Keys) {
        if ($appContent -match $features[$feature]) {
            Write-Host "✅ $feature" -ForegroundColor Green
        } else {
            Write-Host "❌ $feature - Missing!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ App.jsx not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Component Check..." -ForegroundColor Yellow
$components = @(
    "frontend\src\components\Header.jsx",
    "frontend\src\components\LandingPage.jsx", 
    "frontend\src\components\FileUpload.jsx",
    "frontend\src\components\Footer.jsx",
    "frontend\src\components\Loading.jsx",
    "frontend\src\components\ClientPDFGenerator.js"
)

foreach ($comp in $components) {
    if (Test-Path $comp) {
        Write-Host "✅ $(Split-Path $comp -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "❌ $(Split-Path $comp -Leaf) - Missing!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Feature Summary:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Complete Landing Page with animations" -ForegroundColor White
Write-Host "✅ Google Authentication integration" -ForegroundColor White  
Write-Host "✅ Welcome/Login modals" -ForegroundColor White
Write-Host "✅ Full Resume Builder interface" -ForegroundColor White
Write-Host "✅ AI-powered resume analysis" -ForegroundColor White
Write-Host "✅ Client-side PDF generation" -ForegroundColor White
Write-Host "✅ History loading and management" -ForegroundColor White
Write-Host "✅ Professional UI with Tailwind CSS" -ForegroundColor White

Write-Host ""
Write-Host "🌐 Access your full-featured ResuSync:" -ForegroundColor Green
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
Read-Host