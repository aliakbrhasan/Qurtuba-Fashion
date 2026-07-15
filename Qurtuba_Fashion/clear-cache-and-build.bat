@echo off
echo 🧹 Clearing electron-builder cache and rebuilding...
echo.

echo 📦 Step 1: Clearing electron-builder cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
    echo ✅ Cache cleared
) else (
    echo ℹ️  No cache found
)

echo 📦 Step 2: Clearing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dist folder cleared
)

echo 📦 Step 3: Building web assets...
call npm run build
if errorlevel 1 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo 📦 Step 4: Building Electron TypeScript...
call npm run build:electron
if errorlevel 1 (
    echo ❌ Electron TypeScript build failed
    pause
    exit /b 1
)

echo 🏗️ Step 5: Building Electron app with fresh cache...
call electron-builder --win nsis --config.npmRebuild=false --config.nodeGypRebuild=false
if errorlevel 1 (
    echo ❌ Electron builder failed
    pause
    exit /b 1
)

echo.
echo ✅ Electron app built successfully with fresh cache!
echo 📁 Check the 'dist' folder for your installer
echo.
pause

