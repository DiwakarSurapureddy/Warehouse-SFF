@echo off
setlocal enabledelayedexpansion

:: Guarantee execution from the script directory
cd /d "%~dp0"

title SmartFulfill AI - Operations Launcher

echo =======================================================================
echo   SmartFulfill AI - Intelligent Warehouse Decision Intelligence Platform
echo =======================================================================
echo.

:: 1. Verify Python Installation
echo [1/4] Checking Python environment...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: 2. Verify Node.js and npm Installation
echo [2/4] Checking Node.js and npm environment...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js (v18+) and add it to PATH.
    pause
    exit /b 1
)

:: 3. Seed / Verify Backend Database
echo [3/4] Initializing SmartFulfill SQLite Database & Seed Data...
cd /d "%~dp0backend"
python seed\seed_data.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database initialization failed. Please check Python dependencies:
    echo        pip install -r requirements.txt
    pause
    exit /b 1
)

:: 4. Start Python Flask Backend Server
echo.
echo [*] Starting Python Flask Backend on port 5000...
start "SmartFulfill Backend (Port 5000)" cmd /k "cd /d \"%~dp0backend\" && python run.py"

:: 5. Verify Frontend Dependencies & Start React Vite Server
echo.
echo [4/4] Starting React + Vite Frontend Portal on port 3000...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [*] First-time setup: Installing frontend dependencies...
    call npm install
)
start "SmartFulfill Frontend (Port 3000)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo.
echo =======================================================================
echo   SmartFulfill AI is successfully launched!
echo.
echo   - Frontend Portal:  http://localhost:3000
echo   - Backend API:      http://127.0.0.1:5000/api/health
echo =======================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul 2>&1
start http://localhost:3000

echo Press any key to exit this launcher window (services will continue running).
pause >nul
