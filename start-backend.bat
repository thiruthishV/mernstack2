@echo off
title Librio Backend API Server (Port 5001)
echo Starting Librio Backend Server...
cd /d "%~dp0backend"
node server.js
pause
