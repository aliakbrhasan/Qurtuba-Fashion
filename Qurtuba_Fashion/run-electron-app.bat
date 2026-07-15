@echo off
cd /d %~dp0
echo 🚀 تشغيل تطبيق أزياء قرطبة...
echo.

REM Check if dist-electron exists
if not exist "dist-electron\main.js" (
    echo ❌ ملفات Electron غير موجودة. جاري البناء...
    call npm run build:electron
    if errorlevel 1 (
        echo ❌ فشل في بناء ملفات Electron
        pause
        exit /b 1
    )
)

REM Check if build exists
if not exist "build\index.html" (
    echo ❌ ملفات البناء غير موجودة. جاري البناء...
    call npm run build
    if errorlevel 1 (
        echo ❌ فشل في بناء التطبيق
        pause
        exit /b 1
    )
)

echo ✅ تشغيل التطبيق...
electron dist-electron/main.js

if errorlevel 1 (
    echo ❌ فشل في تشغيل التطبيق
    pause
)
