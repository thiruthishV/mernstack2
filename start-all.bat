@echo off
title Starting Librio Library Management System
echo ===================================================
echo  Launching Librio Library Management System
echo ===================================================
echo [1/3] Launching MongoDB Database...
start "Librio MongoDB" "%~dp0start-mongodb.bat"
timeout /t 3 /nobreak >nul

echo [2/3] Launching Backend Server (Port 5001)...
start "Librio Backend" "%~dp0start-backend.bat"
timeout /t 2 /nobreak >nul

echo [3/3] Launching Frontend Server (Port 5173)...
start "Librio Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo Access Librio at: http://localhost:5173
echo.
