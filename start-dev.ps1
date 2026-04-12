# Submittal Tracker — Premium Unified Dev Launcher
Write-Host "[INIT] Preparing Submittal Tracker Ecosystem..." -ForegroundColor Cyan

# 1. Kill any zombie processes squatting on your ports (Port 3002 and 5174)
Write-Host "[CLEANUP] Evicting any leftover ghost processes..." -ForegroundColor Gray
$ports = @(3002, 5174)
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                if ($conn.OwningProcess -gt 0) {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                    Write-Host "  - Terminated ghost process (PID: $($conn.OwningProcess)) on port $port" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        # Port might be free or access denied
    }
}

# 2. Start Backend
Write-Host "[BACKEND] Starting API (Port 3002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$PSScriptRoot" -WindowStyle Minimized

# 3. Start Frontend
Write-Host "[FRONTEND] Preparing Vite Dev Server (Port 5174)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

# 4. The "Ready Check" (Poll until the frontend is actually responding)
Write-Host "[WAIT] Waiting for servers to fully wake up..." -ForegroundColor Cyan
$ready = $false
$attempts = 0
$maxAttempts = 30 # Up to 30 seconds

while (-not $ready -and $attempts -lt $maxAttempts) {
    try {
        # Check if Port 5174 is responding
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response -and $response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { 
            $ready = $true 
        }
    } catch {
        # Still waking up
    }
    
    if (-not $ready) {
        $attempts++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
}

Write-Host "" # New line after dots

if ($ready) {
    Write-Host "[SUCCESS] System is 100% initialized. Actually, 111%." -ForegroundColor Green
    Start-Process "http://localhost:5174"
} else {
    Write-Host "[WARNING] Backend is running, but Frontend is taking longer than expected." -ForegroundColor Yellow
    Write-Host "[ACTION] Opening browser anyway - you might need to refresh in a few seconds." -ForegroundColor Gray
    Start-Process "http://localhost:5174"
}
