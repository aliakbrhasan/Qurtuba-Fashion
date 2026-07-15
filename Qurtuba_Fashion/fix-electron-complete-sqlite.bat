@echo off
echo ========================================
echo إصلاح مشكلة SQLite في Electron
echo ========================================

echo الخطوة 1: حذف الملفات القديمة...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron

echo الخطوة 2: تثبيت التبعيات...
npm install

echo الخطوة 3: إعادة بناء SQLite3 لـ Electron...
npx electron-rebuild -f -w sqlite3

echo الخطوة 4: بناء ملفات Electron...
npm run build:electron

echo الخطوة 5: بناء التطبيق...
npm run build

echo الخطوة 6: إنشاء ملفات التوزيع...
npm run electron:pack

echo ========================================
echo تم الانتهاء من الإصلاح!
echo يمكنك الآن تشغيل التطبيق من مجلد dist/win-unpacked
echo ========================================
pause
