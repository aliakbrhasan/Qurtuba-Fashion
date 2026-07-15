@echo off
echo إصلاح مشكلة main.js في Electron...

echo إيقاف جميع عمليات Electron...
taskkill /f /im "أزياء قرطبة.exe" 2>nul
taskkill /f /im "electron.exe" 2>nul
taskkill /f /im "node.exe" 2>nul

echo انتظار 3 ثوان...
timeout /t 3 /nobreak >nul

echo حذف مجلد dist...
if exist dist rmdir /s /q dist 2>nul

echo حذف مجلد dist-electron...
if exist dist-electron rmdir /s /q dist-electron 2>nul

echo إعادة بناء ملفات Electron...
npm run build:electron

echo إعادة بناء التطبيق...
npm run build

echo إنشاء ملفات التوزيع...
npm run electron:pack

echo نسخ ملفات dist-electron إلى المجلد الرئيسي...
if exist dist\win-unpacked (
    xcopy dist-electron\* dist\win-unpacked\ /E /I /Y
    echo تم نسخ ملفات dist-electron
) else (
    echo تحذير: مجلد dist\win-unpacked غير موجود
)

echo إنشاء ملف package.json في المجلد الرئيسي...
if exist dist\win-unpacked (
    copy package.json dist\win-unpacked\package.json
    echo تم نسخ package.json
)

echo تم الانتهاء من الإصلاح!
echo يمكنك الآن تشغيل التطبيق من مجلد dist\win-unpacked
pause