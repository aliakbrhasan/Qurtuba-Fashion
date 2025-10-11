@echo off
echo 🚀 Building Electron app for Windows...
echo.

REM Set environment variables for proper compilation
set npm_config_msvs_version=2022
set npm_config_python=python
set npm_config_target_arch=x64
set npm_config_disturl=https://electronjs.org/headers
set npm_config_runtime=electron
set npm_config_cache=C:\Users\%USERNAME%\AppData\Local\npm-cache

echo 📦 Step 1: Building web assets...
call npm run build
if errorlevel 1 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo 📦 Step 2: Building Electron TypeScript...
call npm run build:electron
if errorlevel 1 (
    echo ❌ Electron TypeScript build failed
    pause
    exit /b 1
)

echo 🔧 Step 3: Rebuilding sqlite3 for Electron...
call npm run rebuild:sqlite3
if errorlevel 1 (
    echo ⚠️  sqlite3 rebuild failed, trying alternative approach...
    
    REM Try installing sqlite3 with proper configuration
    call npm run install:sqlite3
    if errorlevel 1 (
        echo ❌ sqlite3 installation failed
        echo 💡 You may need to install Visual Studio Build Tools
        pause
        exit /b 1
    )
    
    REM Try rebuilding again
    call npm run rebuild:sqlite3
    if errorlevel 1 (
        echo ⚠️  sqlite3 rebuild still failed, continuing with build...
    )
)

echo 🏗️ Step 4: Building Electron app...
call electron-builder --win nsis
if errorlevel 1 (
    echo ❌ Electron builder failed
    pause
    exit /b 1
)

echo.
echo ✅ Electron app built successfully!
echo 📁 Check the 'dist' folder for your installer
echo.
pause

