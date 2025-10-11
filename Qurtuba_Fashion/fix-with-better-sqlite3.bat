@echo off
echo 🔧 Fixing Electron App with better-sqlite3 (More Reliable)
echo ========================================================
echo.

echo 📦 Step 1: Removing problematic sqlite3...
if exist "node_modules\sqlite3" (
    rmdir /s /q "node_modules\sqlite3"
)

echo.
echo 📦 Step 2: Installing better-sqlite3...
npm install better-sqlite3@9.2.2
if errorlevel 1 (
    echo ❌ better-sqlite3 installation failed
    pause
    exit /b 1
)

echo.
echo 🔧 Step 3: Installing electron-rebuild...
npm install --save-dev electron-rebuild
if errorlevel 1 (
    echo ⚠️  electron-rebuild install failed, trying global...
    npm install -g electron-rebuild
)

echo.
echo 🔧 Step 4: Rebuilding better-sqlite3 for Electron...
npx electron-rebuild -f -w better-sqlite3
if errorlevel 1 (
    echo ⚠️  Rebuild failed, but continuing...
)

echo.
echo 📝 Step 5: Updating package.json to use better-sqlite3...
powershell -Command "(Get-Content package.json) -replace '\"sqlite3\": \"[^\"]*\"', '\"better-sqlite3\": \"^9.2.2\"' | Set-Content package.json"

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
echo Starting Electron app...
npm run electron:dev
if errorlevel 1 (
    echo ❌ Electron app failed to start
    pause
    exit /b 1
)

echo.
echo ✅ Electron app with better-sqlite3 is ready!
echo.
pause
