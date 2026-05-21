# Setup Node.js PATH and start dev server
$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\nvm",
    "C:\nvm"
)

$nodeFound = $false
$nodePath = $null

Write-Host "Searching for Node.js installation..." -ForegroundColor Yellow

foreach ($path in $nodePaths) {
    if (Test-Path "$path\npm.cmd") {
        $nodePath = $path
        $nodeFound = $true
        Write-Host "Found Node.js at: $path" -ForegroundColor Green
        break
    }
}

if (-not $nodeFound) {
    Write-Host "Node.js not found in common locations" -ForegroundColor Red
    Write-Host "Common locations checked:" -ForegroundColor Yellow
    foreach ($path in $nodePaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Write-Host "`nPlease reinstall Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Add to current session PATH if not already there
if ($env:PATH -notlike "*$nodePath*") {
    Write-Host "Adding Node.js to PATH..." -ForegroundColor Yellow
    $env:PATH = "$nodePath;$env:PATH"
}

# Verify node and npm work
Write-Host "Verifying Node.js..." -ForegroundColor Yellow
$nodeVersion = & "$nodePath\node.exe" --version 2>&1
$npmVersion = & "$nodePath\npm.cmd" --version 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "Failed to verify Node.js" -ForegroundColor Red
    exit 1
}

# Change to project directory
Write-Host "`nNavigating to project directory..." -ForegroundColor Yellow
cd "C:\Projects\web-app"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
& "$nodePath\npm.cmd" install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green

# Clear caches
Write-Host "Clearing build caches..." -ForegroundColor Yellow
if (Test-Path ".\.next") {
    Remove-Item ".\.next" -Recurse -Force
    Write-Host "Cleared .next" -ForegroundColor Green
}
if (Test-Path ".\.turbo") {
    Remove-Item ".\.turbo" -Recurse -Force
    Write-Host "Cleared .turbo" -ForegroundColor Green
}

# Start dev server
Write-Host "`nStarting dev server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Aristotle page: http://localhost:3000/aristotle" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

& "$nodePath\npm.cmd" run dev
