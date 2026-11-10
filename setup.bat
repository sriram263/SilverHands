@echo off
title SilverHands Unified - Initial Setup
echo ====================================================
echo   SilverHands Unified - 1-Click Automated Setup
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python and creating virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo [ERROR] Python not found or failed to create venv. Please install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)

echo [2/4] Installing backend Python packages...
call .venv\Scripts\activate.bat
pip install -r backend\requirements.txt

echo [3/4] Running database migrations...
cd backend
python manage.py migrate
cd ..

echo [4/4] Installing frontend npm packages...
cd frontend
call npm.cmd install
cd ..

echo.
echo ====================================================
echo   Setup Complete! You can now run start.bat
echo ====================================================
echo.
pause
