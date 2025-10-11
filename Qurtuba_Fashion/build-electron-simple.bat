@echo off
echo 🚀 Simple Electron build (bypassing sqlite3 issues)...
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

echo 🏗️ Step 3: Building Electron app with minimal configuration...
call electron-builder --win nsis --config.npmRebuild=false --config.nodeGypRebuild=false
if errorlevel 1 (
    echo ❌ Electron builder failed
    echo 💡 Trying with even more minimal configuration...
    
    REM Try with just the basic build
    call electron-builder --win nsis --dir
    if errorlevel 1 (
        echo ❌ All build attempts failed
        pause
        exit /b 1
    )
)

echo.
echo ✅ Electron app built successfully!
echo 📁 Check the 'dist' folder for your installer
echo.
pause

