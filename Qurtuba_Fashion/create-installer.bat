@echo off
cd /d %~dp0
echo 🔨 إنشاء ملف تنصيب أزياء قرطبة...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ تم تشغيل السكريبت كمدير
) else (
    echo ⚠️  تحذير: لم يتم تشغيل السكريبت كمدير
    echo    قد تواجه مشاكل في إنشاء ملف التنصيب
    echo    للحصول على أفضل النتائج، شغل هذا الملف كمدير
    echo.
)

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

REM Create installer
echo 🚀 إنشاء ملف التنصيب...
call npx electron-builder --win nsis --config.win.signAndEditExecutable=false --config.win.signDlls=false
if errorlevel 1 (
    echo ❌ فشل في إنشاء ملف التنصيب
    echo 💡 جرب تشغيل هذا الملف كمدير
    pause
    exit /b 1
)

echo.
echo ✅ تم إنشاء ملف التنصيب بنجاح!
echo 📁 ملف التنصيب: dist\أزياء قرطبة Setup 0.1.0.exe
echo.
pause
