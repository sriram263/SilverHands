@echo off
title SilverHands Unified - Startup
echo ====================================================
echo   Starting SilverHands Unified Platform
echo ====================================================
echo.

cd /d "%~dp0"

echo Starting Django Backend Server on port 8000...
start "SilverHands Backend" cmd /k "cd /d "%~dp0backend" && if exist ..\.venv\Scripts\activate.bat (call ..\.venv\Scripts\activate.bat) && python manage.py runserver 127.0.0.1:8000"

echo Starting Vite Frontend Server on port 5173...
start "SilverHands Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo   Servers are starting up!
echo   Frontend: http://127.0.0.1:5173/
echo   Backend:  http://127.0.0.1:8000/api/
echo ====================================================
echo.
pause
