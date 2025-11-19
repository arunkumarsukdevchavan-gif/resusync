@echo off
title ResuSync - Complete Startup
echo ========================================
echo    ResuSync AI Resume Builder Startup
echo ========================================
echo.

REM Kill any existing node processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM Start backend in new window
echo Starting Backend Server...
start "ResuSync Backend" cmd /k "cd /d C:\ResuSync\resume-co - A1\backend && npm start"

REM Wait a moment for backend to start
timeout /t 5 >nul

REM Start frontend in new window  
echo Starting Frontend Server...
start "ResuSync Frontend" cmd /k "cd /d C:\ResuSync\resume-co - A1\frontend && npm run dev"

REM Wait for servers to initialize
timeout /t 5 >nul

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5001
echo   Frontend: http://localhost:5173
echo   Health:   http://localhost:5001/api/health
echo ========================================
echo.
echo Opening website in 10 seconds...
timeout /t 10 >nul

REM Open the website
start http://localhost:5173

echo.
echo ResuSync is now running!
echo Close this window to keep servers running.
echo To stop servers, close the Backend and Frontend windows.
pause