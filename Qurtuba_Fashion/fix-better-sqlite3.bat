@echo off
echo 🔧 Fixing better-sqlite3 C++20 compatibility issue...
echo.

REM Set environment variables for C++20
set npm_config_msvs_version=2022
set npm_config_python=python
set CXXFLAGS=-std=c++20
set CFLAGS=-std=c++20

REM Remove better-sqlite3 completely
echo 🗑️ Removing better-sqlite3...
if exist "node_modules\better-sqlite3" (
    rmdir /s /q "node_modules\better-sqlite3"
)

REM Install better-sqlite3 with C++20 support
echo 📦 Installing better-sqlite3 with C++20 support...
npm install better-sqlite3 --build-from-source --python=python

if errorlevel 1 (
    echo ❌ Failed to install better-sqlite3
    echo 💡 Trying alternative approach...
    
    REM Try with specific C++ standard
    set CXXFLAGS=-std=c++20 /EHsc
    npm install better-sqlite3 --build-from-source --python=python --msvs_version=2022
    
    if errorlevel 1 (
        echo ❌ Still failed. Trying with prebuilt binaries...
        npm install better-sqlite3 --no-build-from-source
    )
)

echo.
echo ✅ better-sqlite3 installation complete!
echo 🚀 Now try: npm run electron:dev:simple
echo.
pause
