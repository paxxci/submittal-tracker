# Submittal Tracker — Unified Dev Launcher
Write-Host "[INIT] Starting Submittal Tracker Ecosystem..." -ForegroundColor Cyan

# Start Backend
Write-Host "[BACKEND] Starting API (Port 3002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$PSScriptRoot" -WindowStyle Minimized

# Start Frontend
Write-Host "[FRONTEND] Starting Dev Server (Port 5174)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

Write-Host "[SUCCESS] Both servers are spinning up in the background." -ForegroundColor Green
Write-Host "URL: http://localhost:5174"
Write-Host "API: http://localhost:3002/api/status"
