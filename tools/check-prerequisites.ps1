# check-prerequisites.ps1
# Script to verify build environment prerequisites for Sentinel Mic

Write-Host "=== Sentinel Mic - Environment Diagnostics ===" -ForegroundColor Cyan

$allPassed = $true

# 1. Check Node.js
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer -match "v(\d+)") {
        $major = [int]$Matches[1]
        if ($major -ge 20) {
            Write-Host "[✓] Node.js is installed: $nodeVer (Required >= v20)" -ForegroundColor Green
        } else {
            Write-Host "[X] Node.js version is too old: $nodeVer (Required >= v20)" -ForegroundColor Red
            $allPassed = $false
        }
    } else {
        Write-Host "[X] Node.js is not installed or not in PATH." -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "[X] Node.js check failed." -ForegroundColor Red
    $allPassed = $false
}

# 2. Check npm
try {
    $npmVer = & npm --version 2>$null
    if ($npmVer) {
        Write-Host "[✓] npm is installed: v$npmVer" -ForegroundColor Green
    } else {
        Write-Host "[X] npm is not installed or not in PATH." -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "[X] npm check failed." -ForegroundColor Red
    $allPassed = $false
}

# 3. Check Java
$javaHome = $env:JAVA_HOME
if ($javaHome) {
    if (Test-Path $javaHome) {
        Write-Host "[✓] JAVA_HOME is set to: $javaHome" -ForegroundColor Green
        try {
            $javaVer = & java -version 2>&1
            Write-Host "[✓] java -version: $($javaVer[0])" -ForegroundColor Green
        } catch {
            Write-Host "[!] JAVA_HOME is set but running 'java' command failed." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[X] JAVA_HOME is set to $javaHome but directory does not exist!" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "[!] JAVA_HOME is NOT set. Building Android app may fail." -ForegroundColor Yellow
}

# 4. Check Android SDK
$androidHome = $env:ANDROID_HOME
if ($androidHome) {
    if (Test-Path $androidHome) {
        Write-Host "[✓] ANDROID_HOME is set to: $androidHome" -ForegroundColor Green
    } else {
        Write-Host "[X] ANDROID_HOME is set to $androidHome but directory does not exist!" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "[!] ANDROID_HOME is NOT set. Building Android app will fail." -ForegroundColor Yellow
}

Write-Host ""
if ($allPassed) {
    Write-Host ">>> Diagnostics: SUCCESS. Ready to build." -ForegroundColor Green
} else {
    Write-Host ">>> Diagnostics: FAILED. Please resolve missing prerequisites." -ForegroundColor Red
}
