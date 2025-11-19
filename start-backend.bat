@echo off
echo Starting ResuSync Backend Server...
cd /d "C:\ResuSync\resume-co - A1\backend"
echo Current directory: %CD%
echo.
echo Checking if port 5001 is available...
netstat -ano | findstr ":5001" >nul
if %errorlevel% equ 0 (
    echo Port 5001 is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

echo Starting backend server...
npm start
pause