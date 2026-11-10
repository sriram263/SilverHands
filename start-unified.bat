@echo off
title SilverHands Unified Platform
echo ==========================================================
echo    SilverHands - Unified Elder Livelihood Platform
echo ==========================================================
echo.
echo [1/2] Starting Django REST Backend (Port 8000)...
start "SilverHands Backend" cmd /k "cd /d "%~dp0backend" && (if exist "..\.venv\Scripts\activate.bat" call "..\.venv\Scripts\activate.bat") && python manage.py runserver 127.0.0.1:8000"

echo [2/2] Starting Vite React Frontend (Port 5173)...
start "SilverHands Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==========================================================
echo  * Backend running at:  http://127.0.0.1:8000/
echo  * Frontend running at: http://127.0.0.1:5173/
echo ==========================================================
echo.
echo Default Credentials:
echo   - Admin:    admin / admin123
echo   - Customer: demo_customer / demo1234
echo   - Provider: lakshmi / demo1234
echo.
pause
