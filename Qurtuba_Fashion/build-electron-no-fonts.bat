@echo off
echo 🚀 Building Electron app without font installation...
echo.

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

echo 🏗️ Step 3: Building Electron app without font installation...
call electron-builder --win nsis --config.npmRebuild=false --config.nodeGypRebuild=false --config.include=null
if errorlevel 1 (
    echo ❌ Electron builder failed
    pause
    exit /b 1
)

echo.
echo ✅ Electron app built successfully without font installation!
echo 📁 Check the 'dist' folder for your installer
echo.
pause

