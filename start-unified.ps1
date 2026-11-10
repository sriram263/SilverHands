# SilverHands Unified Platform Launcher
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "   SilverHands ? Unified Elder Livelihood Platform" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Yellow

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"
$pythonExe = "c:\mavericks\.venv\Scripts\python.exe"

Write-Host "`n[1/2] Starting Django REST Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; & '$pythonExe' manage.py runserver 0.0.0.0:8000"

Write-Host "[2/2] Starting Vite React Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$frontendDir'; npm.cmd run dev"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Backend running at:  http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "  Frontend running at: http://localhost:5173/" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
