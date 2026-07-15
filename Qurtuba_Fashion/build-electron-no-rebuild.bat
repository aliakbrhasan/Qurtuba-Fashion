@echo off
echo 🚀 Building Electron app without native module rebuilds...
echo.

REM Set environment variables to prevent rebuilds
set npm_config_build_from_source=false
set npm_config_target_arch=x64
set npm_config_disturl=https://electronjs.org/headers
set npm_config_runtime=electron
set npm_config_target=32.0.0

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

echo 🔧 Step 3: Installing sqlite3 with prebuilt binaries...
call npm install sqlite3@5.1.7 --no-build-from-source
if errorlevel 1 (
    echo ⚠️  sqlite3 prebuilt installation failed, trying alternative...
    
    REM Try with different approach
    call npm install sqlite3@5.1.7 --target_platform=win32 --target_arch=x64 --target=32.0.0 --runtime=electron --disturl=https://electronjs.org/headers --no-build-from-source
    if errorlevel 1 (
        echo ❌ sqlite3 installation failed completely
        echo 💡 Continuing build without sqlite3 rebuild...
    )
)

echo 🏗️ Step 4: Building Electron app (skipping native rebuilds)...
call electron-builder --win nsis --config.npmRebuild=false --config.nodeGypRebuild=false --config.buildDependenciesFromSource=false
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

