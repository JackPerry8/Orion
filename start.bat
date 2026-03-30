@echo off
setlocal enabledelayedexpansion

echo.
echo   ██╗  ██╗██████╗  █████╗ ████████╗ ██████╗ ███████╗
echo   ██║ ██╔╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔════╝
echo   █████╔╝ ██████╔╝███████║   ██║   ██║   ██║███████╗
echo   ██╔═██╗ ██╔══██╗██╔══██║   ██║   ██║   ██║╚════██║
echo   ██║  ██╗██║  ██║██║  ██║   ██║   ╚██████╔╝███████║
echo   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝
echo.

:: Move to script directory
cd /d "%~dp0"

:: ── Check for .env ──────────────────────────────────────────────────────
if not exist ".env" (
    echo No .env file found. Creating one from .env.example...
    copy .env.example .env >nul
    echo.
    echo Please open .env and add your ANTHROPIC_API_KEY, then re-run this script.
    pause
    exit /b 1
)

findstr /c:"your_api_key_here" .env >nul 2>&1
if !errorlevel! == 0 (
    echo Error: ANTHROPIC_API_KEY is not set in .env.
    echo Open .env and replace 'your_api_key_here' with your key.
    pause
    exit /b 1
)

:: ── Check prerequisites ──────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo Error: python not found. Install Python 3.10+ from https://python.org
    pause & exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo Error: node not found. Install Node.js 18+ from https://nodejs.org
    pause & exit /b 1
)

where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo Error: ffmpeg not found.
    echo Install via winget: winget install Gyan.FFmpeg
    echo Or download from: https://ffmpeg.org/download.html
    pause & exit /b 1
)

echo [OK] Prerequisites found

:: ── Backend ──────────────────────────────────────────────────────────────
echo.
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo Failed to install Python dependencies.
    pause & exit /b 1
)
echo [OK] Python dependencies installed

echo Starting backend...
start /B python app.py
cd ..

:: Give backend time to start
timeout /t 3 /nobreak >nul

:: ── Frontend ─────────────────────────────────────────────────────────────
echo.
echo Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo Failed to install npm dependencies.
    pause & exit /b 1
)
echo [OK] Frontend dependencies installed

echo Starting frontend...
start /B npm run dev
cd ..

echo.
echo ══════════════════════════════════════════════════
echo   Kratos is running!
echo   Open http://localhost:5173 in your browser
echo   Backend API: http://localhost:8000
echo ══════════════════════════════════════════════════
echo   Press Ctrl+C to stop
echo ══════════════════════════════════════════════════
echo.

:: Keep window open
pause
