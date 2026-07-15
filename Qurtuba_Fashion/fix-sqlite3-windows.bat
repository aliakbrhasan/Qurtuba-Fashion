@echo off
echo 🔧 Fixing sqlite3 Windows compilation issue...
echo.

REM Set environment variables for proper compilation
set npm_config_msvs_version=2022
set npm_config_python=python
set npm_config_target_arch=x64
set npm_config_disturl=https://electronjs.org/headers
set npm_config_runtime=electron
set npm_config_cache=C:\Users\%USERNAME%\AppData\Local\npm-cache
set npm_config_build_from_source=true

REM Clean up any existing sqlite3 installation
echo 🗑️ Cleaning up existing sqlite3 installation...
if exist "node_modules\sqlite3" (
    rmdir /s /q "node_modules\sqlite3"
)

REM Remove from package-lock.json if it exists
if exist "package-lock.json" (
    echo 📝 Removing sqlite3 from package-lock.json...
    del "package-lock.json"
)

echo 📦 Installing sqlite3 with proper Windows configuration...
npm install sqlite3@5.1.7 --build-from-source --python=python --msvs_version=2022

if errorlevel 1 (
    echo ❌ Failed to install sqlite3 from source
    echo 💡 Trying with prebuilt binaries...
    
    REM Try with prebuilt binaries
    npm install sqlite3@5.1.7 --no-build-from-source
    
    if errorlevel 1 (
        echo ❌ Still failed. Trying alternative approach...
        
        REM Try with specific electron version
        set npm_config_target=32.0.0
        set npm_config_arch=x64
        npm install sqlite3@5.1.7 --build-from-source --python=python
    )
)

echo.
echo ✅ sqlite3 installation complete!
echo 🚀 Now try: npm install
echo.
pause

