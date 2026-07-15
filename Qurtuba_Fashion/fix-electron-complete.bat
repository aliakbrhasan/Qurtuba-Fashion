@echo off
echo 🔧 Complete Electron App Fix for Windows
echo ========================================
echo.

REM Set proper environment variables
set npm_config_cache=C:\Users\msi\AppData\Local\npm-cache
set npm_config_registry=https://registry.npmjs.org/

echo 📦 Step 1: Cleaning up existing installations...
if exist "node_modules\sqlite3" (
    echo Removing existing sqlite3...
    rmdir /s /q "node_modules\sqlite3"
)

if exist "node_modules\electron-rebuild" (
    echo Removing existing electron-rebuild...
    rmdir /s /q "node_modules\electron-rebuild"
)

echo.
echo 📦 Step 2: Installing electron-rebuild globally...
npm install -g electron-rebuild
if errorlevel 1 (
    echo ⚠️  Global install failed, trying local install...
    npm install --save-dev electron-rebuild
)

echo.
echo 📦 Step 3: Installing sqlite3 with proper configuration...
set npm_config_target_arch=x64
set npm_config_target_platform=win32
set npm_config_runtime=electron
set npm_config_target=32.0.0
set npm_config_disturl=https://electronjs.org/headers

npm install sqlite3@5.1.7
if errorlevel 1 (
    echo ❌ sqlite3 installation failed
    echo 💡 Trying with prebuilt binaries...
    npm install sqlite3@5.1.7 --no-build-from-source
)

echo.
echo 🔧 Step 4: Rebuilding sqlite3 for Electron...
npx electron-rebuild -f -w sqlite3
if errorlevel 1 (
    echo ⚠️  electron-rebuild failed, trying manual rebuild...
    cd node_modules\sqlite3
    npm run install
    cd ..\..
)

echo.
echo 🧪 Step 5: Testing sqlite3 installation...
node -e "const sqlite3 = require('sqlite3'); console.log('✅ sqlite3 loaded successfully');"
if errorlevel 1 (
    echo ❌ sqlite3 test failed
    echo 💡 Trying alternative approach...
    
    REM Try installing better-sqlite3 as alternative
    npm install better-sqlite3@9.2.2
    if errorlevel 1 (
        echo ❌ All sqlite installations failed
        pause
        exit /b 1
    )
)

echo.
echo 🏗️ Step 6: Building Electron TypeScript...
npm run build:electron
if errorlevel 1 (
    echo ❌ TypeScript build failed
    pause
    exit /b 1
)

echo.
echo 🚀 Step 7: Testing Electron app...
echo Starting Electron app in development mode...
npm run electron:dev
if errorlevel 1 (
    echo ❌ Electron app failed to start
    echo 💡 Trying simple mode...
    npm run electron:dev:simple
)

echo.
echo ✅ Electron app fix completed!
echo.
pause
