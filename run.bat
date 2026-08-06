@echo off
echo ===================================================
echo 🚀 Starting MediSync AI Stack (Windows)
echo ===================================================

echo.
echo Starting Python AI Microservice (Port 8000)...
start "MediSync AI Microservice" cmd /k ".\apps\ai-service\venv\Scripts\python.exe apps\ai-service\main.py"

echo Starting Express Backend (Port 3001)...
start "MediSync Express Backend" cmd /k "npx pnpm --filter @medisync/backend dev"

echo Starting Web Portals Frontend (Port 3000)...
start "MediSync Web Portals" cmd /k "npx pnpm --filter @medisync/web-portals dev"

echo.
echo ===================================================
echo All services launched in separate windows!
echo Open http://localhost:3000 in your browser.
echo ===================================================
