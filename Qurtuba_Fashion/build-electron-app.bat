@echo off
cd /d %~dp0
echo 🔨 بناء تطبيق أزياء قرطبة...
echo.

REM Clean previous builds
echo 🧹 تنظيف البناء السابق...
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"

REM Build React app
echo 📦 بناء تطبيق React...
call npm run build
if errorlevel 1 (
    echo ❌ فشل في بناء تطبيق React
    pause
    exit /b 1
)

REM Build Electron TypeScript
echo ⚡ تجميع ملفات Electron TypeScript...
call npm run build:electron
if errorlevel 1 (
    echo ❌ فشل في تجميع ملفات Electron
    pause
    exit /b 1
)

REM Build Electron app (directory only, no installer)
echo 🚀 بناء تطبيق Electron...
call npx electron-builder --win --dir --config.win.signAndEditExecutable=false --config.win.signDlls=false
if errorlevel 1 (
    echo ❌ فشل في بناء تطبيق Electron
    pause
    exit /b 1
)

echo.
echo ✅ تم البناء بنجاح!
echo 📁 مجلد التطبيق: dist\win-unpacked
echo 🚀 لتشغيل التطبيق: dist\win-unpacked\أزياء قرطبة.exe
echo.
pause
