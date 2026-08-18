# SmartFulfill AI - PowerShell Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  SmartFulfill AI - Intelligent Warehouse Operations Platform" -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python
Write-Host "[1/4] Checking Python environment..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python was not found in PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Check Node
Write-Host "[2/4] Checking Node.js environment..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not found in PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# 3. Seed Database
Write-Host "[3/4] Initializing Database & Seed Data..." -ForegroundColor Yellow
Set-Location "$ScriptDir\backend"
python seed\seed_data.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database seeding failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# 4. Launch Backend
Write-Host "[*] Launching Backend Server on port 5000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$ScriptDir\backend`" && python run.py" -WindowStyle Normal

# 5. Launch Frontend
Write-Host "[4/4] Launching Frontend Portal on port 3000..." -ForegroundColor Green
Set-Location "$ScriptDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}
Start-Process cmd -ArgumentList "/k cd /d `"$ScriptDir\frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  SmartFulfill AI is running!" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://127.0.0.1:5000/api/health" -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
