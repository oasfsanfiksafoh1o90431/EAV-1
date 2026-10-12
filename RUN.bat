@echo off
title E.A.V. Gomez Lying-In Clinic
cd /d "D:\code for thesis"

echo ============================================
echo  E.A.V. GOMEZ LYING IN CLINIC
echo  Starting system...
echo ============================================
echo.

REM --- Free the ports if a previous run is still holding them ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  echo Port 5173 busy - stopping old process...
  taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
  echo Port 3001 busy - stopping old process...
  taskkill /F /PID %%p >nul 2>&1
)
echo.

REM --- 1. Backend (MySQL API) in its own window ---
echo Starting backend on http://localhost:3001 ...
start "Clinic Backend" cmd /k "cd /d ""D:\code for thesis"" && npm run server"

REM Give the backend a moment to connect to MySQL
timeout /t 4 >nul

REM --- 2. Frontend ---
echo Starting frontend on http://localhost:5173 ...
echo.
echo When both windows are running, open: http://localhost:5173
echo Login: owner@eavgomez.com / superadmin123
echo.
start "" http://localhost:5173

npm run dev
