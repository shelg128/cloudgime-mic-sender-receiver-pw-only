# setup-dependencies.ps1
# Script to install project dependencies and auto-generate local.properties for Android

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$parentDir = Split-Path -Parent $scriptDir
$senderDir = Join-Path $parentDir "source\mic-sender-android-windows"
$receiverDir = Join-Path $parentDir "source\mic-receiver-windows"

Write-Host "=== Sentinel Mic - Project Dependency Setup ===" -ForegroundColor Cyan

# 1. Install Node modules for Sentinel Mic Sender
if (Test-Path $senderDir) {
    Write-Host "Setting up Sentinel Mic Sender (Android & Windows)..." -ForegroundColor Yellow
    Push-Location $senderDir
    try {
        Write-Host "Running 'npm install' in sender folder..." -ForegroundColor Cyan
        npm install
        Write-Host "[✓] npm install completed for Sender." -ForegroundColor Green
    } catch {
        Write-Host "[X] npm install failed in Sender folder." -ForegroundColor Red
    }
    
    # Auto-generate local.properties for Android
    $androidDir = Join-Path $senderDir "android"
    if (Test-Path $androidDir) {
        $localPropPath = Join-Path $androidDir "local.properties"
        $androidHome = $env:ANDROID_HOME
        if ($androidHome) {
            # Normalize path for properties file (escape backslashes)
            $escapedAndroidHome = $androidHome -replace '\\', '\\\\'
            $escapedAndroidHome = $escapedAndroidHome -replace ':', '\:'
            $propContent = "sdk.dir=$escapedAndroidHome"
            [System.IO.File]::WriteAllText($localPropPath, $propContent, [System.Text.Encoding]::UTF8)
            Write-Host "[✓] Automatically generated android/local.properties with sdk.dir=$androidHome" -ForegroundColor Green
        } else {
            Write-Host "[!] ANDROID_HOME environment variable not found. Skipping auto-generation of local.properties." -ForegroundColor Yellow
            Write-Host "    You will need to manually create: $localPropPath with sdk.dir=<path_to_android_sdk>" -ForegroundColor Yellow
        }
    }
    Pop-Location
} else {
    Write-Host "[X] Sender source directory not found at $senderDir" -ForegroundColor Red
}

Write-Host ""

# 2. Install Node modules for Sentinel Mic Receiver
if (Test-Path $receiverDir) {
    Write-Host "Setting up Sentinel Mic Receiver (Windows)..." -ForegroundColor Yellow
    Push-Location $receiverDir
    try {
        Write-Host "Running 'npm install' in receiver folder..." -ForegroundColor Cyan
        npm install
        Write-Host "[✓] npm install completed for Receiver." -ForegroundColor Green
    } catch {
        Write-Host "[X] npm install failed in Receiver folder." -ForegroundColor Red
    }
    Pop-Location
} else {
    Write-Host "[X] Receiver source directory not found at $receiverDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Completed ===" -ForegroundColor Green
