@echo off
echo Starting ResuSync Frontend Server...
cd /d "C:\ResuSync\resume-co - A1\frontend"
echo Current directory: %CD%
echo.
echo Checking if port 5173 is available...
netstat -ano | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo Port 5173 is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

echo Starting frontend server...
npm run dev
pause