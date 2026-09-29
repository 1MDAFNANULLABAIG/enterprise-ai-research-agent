# Enterprise AI Research & Document Agent - Local Runner
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Enterprise AI Research & Document Agent" -ForegroundColor White
Write-Host "  Production Architecture Local Runner" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendDir = "$PSScriptRoot\backend"
$frontendDir = "$PSScriptRoot\frontend"
$pythonExe = "$backendDir\venv\Scripts\python.exe"

# 1. Seed demo database if needed
Write-Host "`n[1/3] Verifying and seeding demo documents & users..." -ForegroundColor Yellow
& $pythonExe "$backendDir\seed_demo.py"

# 2. Launch FastAPI Backend in background
Write-Host "`n[2/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath $pythonExe -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" -WorkingDirectory $backendDir -PassThru

Start-Sleep -Seconds 2

# 3. Launch Frontend
Write-Host "`n[3/3] Starting React Vite Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Set-Location $frontendDir
npm.cmd run dev
