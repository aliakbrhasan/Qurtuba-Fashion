@echo off
echo إيقاف جميع عمليات Electron...

echo إنهاء عمليات Electron...
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

echo تم الانتهاء!
pause
